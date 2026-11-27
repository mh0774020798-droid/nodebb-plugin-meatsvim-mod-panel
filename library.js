'use strict';

/*
 * Mod Panel for NodeBB
 * Built by מעצבים טופ — https://meatsvim.top
 */

const nconf = require.main.require('nconf');
const winston = require.main.require('winston');

const db = require.main.require('./src/database');
const meta = require.main.require('./src/meta');
const user = require.main.require('./src/user');
const groups = require.main.require('./src/groups');
const posts = require.main.require('./src/posts');
const flags = require.main.require('./src/flags');
const routeHelpers = require.main.require('./src/routes/helpers');
const controllerHelpers = require.main.require('./src/controllers/helpers');

const SETTINGS_KEY = 'mod-panel';
const SECTIONS = ['overview', 'flags', 'queue', 'bans'];
const DEFAULTS = {
	title: '',
	accent: '#a67c2e',
	overviewGroups: '',
	flagsGroups: '',
	queueGroups: '',
	bansGroups: '',
};
const PAGE_SIZE = 20;

const plugin = {};

// ---------------------------------------------------------------- settings
async function getSettings() {
	const saved = await meta.settings.get(SETTINGS_KEY);
	const settings = { ...DEFAULTS, ...(saved || {}) };
	if (!/^#[0-9a-f]{3,8}$/i.test(String(settings.accent || '').trim())) {
		settings.accent = DEFAULTS.accent;
	}
	return settings;
}

function parseGroups(value) {
	if (Array.isArray(value)) {
		return value.map(String).map(s => s.trim()).filter(Boolean);
	}
	return String(value || '').split(',').map(s => s.trim()).filter(Boolean);
}

// ---------------------------------------------------------------- permissions
/**
 * Works out what a user may see and do in the panel.
 *  - Administrators: everything.
 *  - If the admin picked groups for a section: members of those groups get that section (site-wide).
 *  - Otherwise the NodeBB defaults apply: global moderators get overview/flags/queue/bans,
 *    category moderators get overview/flags/queue limited to the categories they moderate.
 */
async function getAccess(uid) {
	uid = parseInt(uid, 10);
	if (!uid || uid <= 0) {
		return null;
	}
	const [isAdmin, isGlobalMod, moderatedCids, settings] = await Promise.all([
		user.isAdministrator(uid),
		user.isGlobalModerator(uid),
		user.getModeratedCids(uid),
		getSettings(),
	]);
	const cids = (moderatedCids || []).map(cid => parseInt(cid, 10)).filter(Boolean);

	const sections = {};
	const scope = {};
	await Promise.all(SECTIONS.map(async (section) => {
		const chosen = parseGroups(settings[`${section}Groups`]);
		if (isAdmin) {
			sections[section] = true;
			scope[section] = null;
			return;
		}
		if (chosen.length) {
			const membership = await groups.isMemberOfGroups(uid, chosen);
			if (membership.some(Boolean)) {
				sections[section] = true;
				scope[section] = null;
				return;
			}
			sections[section] = false;
			return;
		}
		if (isGlobalMod) {
			sections[section] = true;
			scope[section] = null;
		} else if (cids.length && section !== 'bans') {
			sections[section] = true;
			scope[section] = cids;
		} else {
			sections[section] = false;
		}
	}));

	const allowed = SECTIONS.some(s => sections[s]);
	return { uid, isAdmin, isGlobalMod, cids, sections, scope, allowed, settings };
}

async function requireSection(req, section) {
	const access = await getAccess(req.uid);
	if (!access || !access.sections[section]) {
		const err = new Error('[[error:no-privileges]]');
		err.status = 403;
		throw err;
	}
	return access;
}

function inScope(scopeCids, cid) {
	if (!scopeCids) {
		return true;
	}
	return scopeCids.includes(parseInt(cid, 10));
}

// ---------------------------------------------------------------- data
async function countOpenFlags(scopeCids) {
	if (!scopeCids) {
		return db.sortedSetCard('flags:byState:open');
	}
	const res = await flags.list({
		filters: { state: 'open', cid: scopeCids, page: 1, perPage: 1 },
		sort: 'newest',
		uid: 0,
		query: {},
	});
	return res.count || (res.pageCount || 0);
}

async function listFlags(access, state, page) {
	const filters = { state: state || 'open', page: page || 1, perPage: PAGE_SIZE };
	if (access.scope.flags) {
		filters.cid = access.scope.flags;
	}
	const res = await flags.list({ filters, sort: 'newest', uid: access.uid, query: {} });
	const items = (res.flags || []).map(f => ({
		flagId: f.flagId,
		type: f.type,
		targetId: f.targetId,
		target_readable: f.target_readable,
		state: f.state,
		heat: f.heat,
		datetime: f.datetime,
		datetimeISO: f.datetimeISO,
		reporter: f.reporter ? { username: f.reporter.username, userslug: f.reporter.userslug } : null,
		description: f.description || (Array.isArray(f.reports) && f.reports[0] ? f.reports[0].value : ''),
	}));
	return { items, page: res.page || filters.page, pageCount: res.pageCount || 1 };
}

async function listQueue(access) {
	const filter = {};
	if (access.scope.queue) {
		filter.cid = access.scope.queue;
	}
	const queued = await posts.getQueuedPosts(filter, { metadata: true });
	return (queued || []).slice(0, 100).map(q => ({
		id: q.id,
		type: q.type,
		datetime: q.datetime,
		datetimeISO: q.datetimeISO || (q.datetime ? new Date(parseInt(q.datetime, 10)).toISOString() : ''),
		user: q.user ? { uid: q.user.uid, username: q.user.username, userslug: q.user.userslug } : null,
		title: q.data && (q.data.title || (q.topic && q.topic.title)) || '',
		content: q.data ? String(q.data.content || '').slice(0, 600) : '',
		cid: q.data && q.data.cid,
		category: q.category ? { name: q.category.name, slug: q.category.slug } : null,
		topic: q.topic ? { title: q.topic.title, slug: q.topic.slug } : null,
	}));
}

async function listBans(access) {
	const users = await user.getUsersFromSet('users:banned', access.uid, 0, 99);
	return (users || []).filter(Boolean).map(u => ({
		uid: u.uid,
		username: u.username,
		userslug: u.userslug,
		picture: u.picture,
		'icon:text': u['icon:text'],
		'icon:bgColor': u['icon:bgColor'],
		bannedUntil: parseInt(u['banned:expire'], 10) || 0,
	}));
}

// ---------------------------------------------------------------- hooks
plugin.init = async function ({ router, middleware }) {
	routeHelpers.setupPageRoute(router, '/mod-panel', [middleware.ensureLoggedIn], async (req, res, next) => {
		try {
			const access = await getAccess(req.uid);
			if (!access || !access.allowed) {
				return controllerHelpers.notAllowed(req, res);
			}
			res.render('mod-panel', {
				title: access.settings.title || '[[mod-panel:title]]',
				panelTitle: access.settings.title || '',
				accent: access.settings.accent,
				sections: access.sections,
				scoped: !!(access.scope.flags || access.scope.queue),
				breadcrumbs: controllerHelpers.buildBreadcrumbs([{ text: '[[mod-panel:title]]' }]),
			});
		} catch (err) {
			next(err);
		}
	});

	routeHelpers.setupAdminPageRoute(router, '/admin/plugins/mod-panel', async (req, res) => {
		const names = await db.getSortedSetRange('groups:createtime', 0, -1);
		const visible = (names || []).filter(name => name && !groups.isPrivilegeGroup(name) && !name.startsWith('cid:'));
		const settings = await getSettings();
		res.render('admin/plugins/mod-panel', {
			title: 'Mod Panel',
			groups: visible.sort().map(name => ({ name })),
			settingsJSON: JSON.stringify(settings),
			sections: SECTIONS.map(id => ({ id })),
		});
	});

	winston.info('[mod-panel] ready');
};

plugin.addRoutes = async function ({ router, middleware, helpers }) {
	const guard = [middleware.ensureLoggedIn];
	const wrap = fn => async (req, res) => {
		try {
			helpers.formatApiResponse(200, res, await fn(req));
		} catch (err) {
			helpers.formatApiResponse(err.status || 500, res, err);
		}
	};

	routeHelpers.setupApiRoute(router, 'get', '/mod-panel/overview', guard, wrap(async (req) => {
		const access = await requireSection(req, 'overview');
		const [openFlags, queueCount, banCount] = await Promise.all([
			access.sections.flags ? countOpenFlags(access.scope.flags) : null,
			access.sections.queue ? (access.scope.queue ? listQueue(access).then(q => q.length) : db.sortedSetCard('post:queue')) : null,
			access.sections.bans ? db.sortedSetCard('users:banned') : null,
		]);
		const recent = access.sections.flags ? (await listFlags(access, 'open', 1)).items.slice(0, 5) : [];
		return { openFlags, queueCount, banCount, recentFlags: recent, sections: access.sections };
	}));

	routeHelpers.setupApiRoute(router, 'get', '/mod-panel/flags', guard, wrap(async (req) => {
		const access = await requireSection(req, 'flags');
		const state = ['open', 'wip', 'resolved', 'rejected'].includes(req.query.state) ? req.query.state : 'open';
		return listFlags(access, state, Math.max(1, parseInt(req.query.page, 10) || 1));
	}));

	routeHelpers.setupApiRoute(router, 'put', '/mod-panel/flags/:flagId', guard, wrap(async (req) => {
		const access = await requireSection(req, 'flags');
		const state = req.body && req.body.state;
		if (!['open', 'wip', 'resolved', 'rejected'].includes(state)) {
			throw new Error('[[error:invalid-data]]');
		}
		const flagId = parseInt(req.params.flagId, 10);
		if (access.scope.flags) {
			// category moderators may only change post flags inside their own categories
			const flag = await db.getObject(`flag:${flagId}`);
			const cid = flag && flag.type === 'post' ? await posts.getCidByPid(flag.targetId) : null;
			if (!cid || !inScope(access.scope.flags, cid)) {
				const err = new Error('[[error:no-privileges]]');
				err.status = 403;
				throw err;
			}
		}
		await flags.update(flagId, req.uid, { state });
		return { flagId, state };
	}));

	routeHelpers.setupApiRoute(router, 'get', '/mod-panel/queue', guard, wrap(async (req) => {
		const access = await requireSection(req, 'queue');
		return { items: await listQueue(access) };
	}));

	routeHelpers.setupApiRoute(router, 'post', '/mod-panel/queue/:id', guard, wrap(async (req) => {
		const access = await requireSection(req, 'queue');
		const action = req.body && req.body.action;
		if (!['accept', 'reject'].includes(action)) {
			throw new Error('[[error:invalid-data]]');
		}
		const id = String(req.params.id);
		const queued = await posts.getQueuedPosts({ id }, { metadata: false });
		const item = queued && queued[0];
		if (!item) {
			throw new Error('[[error:no-post]]');
		}
		if (!inScope(access.scope.queue, item.data && item.data.cid)) {
			const err = new Error('[[error:no-privileges]]');
			err.status = 403;
			throw err;
		}
		if (action === 'accept') {
			await posts.submitFromQueue(id);
		} else {
			await posts.removeFromQueue(id);
		}
		return { id, action };
	}));

	routeHelpers.setupApiRoute(router, 'get', '/mod-panel/bans', guard, wrap(async (req) => {
		const access = await requireSection(req, 'bans');
		return { items: await listBans(access) };
	}));

	routeHelpers.setupApiRoute(router, 'delete', '/mod-panel/bans/:uid', guard, wrap(async (req) => {
		await requireSection(req, 'bans');
		const targetUid = parseInt(req.params.uid, 10);
		if (!targetUid) {
			throw new Error('[[error:invalid-uid]]');
		}
		if (await user.isAdministrator(targetUid) && !(await user.isAdministrator(req.uid))) {
			const err = new Error('[[error:no-privileges]]');
			err.status = 403;
			throw err;
		}
		await user.bans.unban(targetUid, '[[mod-panel:unbanned-from-panel]]');
		return { uid: targetUid };
	}));
};

plugin.addAdminNavigation = async function (header) {
	header.plugins.push({
		route: '/plugins/mod-panel',
		icon: 'fa-shield',
		name: 'Mod Panel',
	});
	return header;
};

plugin.addNavigation = async function (items) {
	items.push({
		route: '/mod-panel',
		title: '[[mod-panel:title]]',
		enabled: false,
		iconClass: 'fa-shield',
		textClass: 'd-lg-none',
		text: '[[mod-panel:title]]',
	});
	return items;
};

plugin.exposeConfig = async function (config) {
	config.modPanel = { url: `${nconf.get('relative_path')}/mod-panel` };
	return config;
};

module.exports = plugin;
