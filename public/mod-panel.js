'use strict';

/* Mod Panel — client page. Built by מעצבים טופ (https://meatsvim.top) */

define('forum/mod-panel', ['api', 'alerts', 'translator'], function (api, alerts, translator) {
	const ModPanel = {};
	const rel = (window.config && config.relative_path) || '';
	let $root;
	let current = 'overview';
	let flagState = 'open';
	let flagPage = 1;

	function esc(s) {
		return String(s == null ? '' : s)
			.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
	}
	function stripHtml(s) {
		const d = document.createElement('div');
		d.innerHTML = String(s || '');
		return d.textContent || '';
	}
	function ago(ts, iso) {
		const t = iso ? Date.parse(iso) : parseInt(ts, 10);
		if (!t) { return ''; }
		return '<span class="timeago" title="' + esc(new Date(t).toISOString()) + '"></span>';
	}
	function paint(html) {
		translator.translate(html, function (out) {
			const $body = $root.find('[data-mp-body]');
			$body.html(out);
			if ($.fn.timeago) { $body.find('.timeago').timeago(); }
		});
	}
	function empty(icon, key) {
		return '<div class="mp-empty"><i class="fa ' + icon + '"></i><p>[[mod-panel:' + key + ']]</p></div>';
	}
	function fail(err) {
		alerts.error(err && err.message ? err.message : err);
	}
	function setBadge(name, n) {
		const $b = $root.find('[data-count="' + name + '"]');
		if (n == null) { return; }
		$b.text(n > 0 ? n : '').toggleClass('show', n > 0);
	}

	// ------------------------------------------------------------ overview
	function overview() {
		api.get('/plugins/mod-panel/overview', {}).then(function (d) {
			setBadge('flags', d.openFlags);
			setBadge('queue', d.queueCount);
			setBadge('bans', d.banCount);
			let html = '<div class="mp-cards">';
			if (d.sections.flags) { html += card('fa-flag', d.openFlags, 'stat-flags', 'flags'); }
			if (d.sections.queue) { html += card('fa-list-check', d.queueCount, 'stat-queue', 'queue'); }
			if (d.sections.bans) { html += card('fa-ban', d.banCount, 'stat-bans', 'bans'); }
			html += '</div>';
			if (d.sections.flags) {
				html += '<h3 class="mp-h">[[mod-panel:recent-flags]]</h3>';
				html += d.recentFlags.length ? flagTable(d.recentFlags, true) : empty('fa-circle-check', 'no-flags');
			}
			paint(html);
		}).catch(fail);
	}
	function card(icon, n, key, section) {
		return '<button type="button" class="mp-card" data-go="' + section + '"><i class="fa ' + icon + '"></i>' +
			'<b>' + (n == null ? '—' : n) + '</b><span>[[mod-panel:' + key + ']]</span></button>';
	}

	// ------------------------------------------------------------ flags
	function flagTable(items, compact) {
		let html = '<div class="table-responsive"><table class="table mp-table"><thead><tr>' +
			'<th>[[mod-panel:col-target]]</th><th>[[mod-panel:col-reason]]</th><th>[[mod-panel:col-reports]]</th>' +
			'<th>[[mod-panel:col-time]]</th>' + (compact ? '' : '<th>[[mod-panel:col-actions]]</th>') + '</tr></thead><tbody>';
		items.forEach(function (f) {
			const typeKey = f.type === 'user' ? 'type-user' : (f.type === 'chat' ? 'type-chat' : 'type-post');
			html += '<tr data-flag="' + esc(f.flagId) + '">' +
				'<td><span class="mp-pill">[[mod-panel:' + typeKey + ']]</span> <a href="' + rel + '/flags/' + esc(f.flagId) + '">' + esc(f.target_readable || ('#' + f.targetId)) + '</a></td>' +
				'<td class="mp-reason">' + esc(stripHtml(f.description).slice(0, 140)) + '</td>' +
				'<td><span class="mp-heat">' + esc(f.heat || 1) + '</span></td>' +
				'<td>' + ago(f.datetime, f.datetimeISO) + '</td>';
			if (!compact) {
				html += '<td class="mp-actions">' +
					(f.state !== 'resolved' ? '<button class="btn btn-sm mp-btn mp-ok" data-flag-state="resolved"><i class="fa fa-check"></i> [[mod-panel:resolve]]</button>' : '') +
					(f.state !== 'rejected' ? '<button class="btn btn-sm mp-btn" data-flag-state="rejected"><i class="fa fa-xmark"></i> [[mod-panel:reject]]</button>' : '') +
					(f.state !== 'wip' && f.state !== 'resolved' ? '<button class="btn btn-sm mp-btn" data-flag-state="wip"><i class="fa fa-hourglass-half"></i> [[mod-panel:wip]]</button>' : '') +
					'</td>';
			}
			html += '</tr>';
		});
		return html + '</tbody></table></div>';
	}
	function flagsView() {
		api.get('/plugins/mod-panel/flags', { state: flagState, page: flagPage }).then(function (d) {
			if (flagState === 'open') { setBadge('flags', d.items.length && d.pageCount === 1 ? d.items.length : null); }
			let html = '<div class="mp-filter">';
			['open', 'wip', 'resolved', 'rejected'].forEach(function (s) {
				html += '<button type="button" class="mp-chip' + (s === flagState ? ' on' : '') + '" data-flag-filter="' + s + '">[[mod-panel:state-' + s + ']]</button>';
			});
			html += '<a class="mp-link" href="' + rel + '/flags">[[mod-panel:open-full-flags]] <i class="fa fa-arrow-left"></i></a></div>';
			html += d.items.length ? flagTable(d.items, false) : empty('fa-circle-check', 'no-flags');
			if (d.pageCount > 1) {
				html += '<div class="mp-pages">' +
					(d.page > 1 ? '<button class="btn btn-sm mp-btn" data-flag-page="' + (d.page - 1) + '">‹</button>' : '') +
					'<span>' + d.page + ' / ' + d.pageCount + '</span>' +
					(d.page < d.pageCount ? '<button class="btn btn-sm mp-btn" data-flag-page="' + (d.page + 1) + '">›</button>' : '') +
					'</div>';
			}
			paint(html);
		}).catch(fail);
	}

	// ------------------------------------------------------------ queue
	function queueView() {
		api.get('/plugins/mod-panel/queue', {}).then(function (d) {
			setBadge('queue', d.items.length);
			if (!d.items.length) { return paint(empty('fa-inbox', 'no-queue')); }
			let html = '<div class="mp-queue">';
			d.items.forEach(function (q) {
				const where = q.category ? '<a href="' + rel + '/category/' + esc(q.category.slug) + '">' + esc(q.category.name) + '</a>' : '';
				const topic = q.type === 'topic' ? esc(q.title) : (q.topic ? '<a href="' + rel + '/topic/' + esc(q.topic.slug) + '">' + esc(q.topic.title) + '</a>' : '');
				html += '<div class="mp-qitem" data-queue="' + esc(q.id) + '">' +
					'<div class="mp-qhead"><span class="mp-pill">[[mod-panel:' + (q.type === 'topic' ? 'new-topic' : 'new-reply') + ']]</span> ' +
					(q.user ? '<a href="' + rel + '/user/' + esc(q.user.userslug) + '">' + esc(q.user.username) + '</a>' : '') +
					' · ' + where + ' · ' + ago(q.datetime, q.datetimeISO) + '</div>' +
					(topic ? '<div class="mp-qtitle">' + topic + '</div>' : '') +
					'<div class="mp-qcontent">' + esc(stripHtml(q.content)) + '</div>' +
					'<div class="mp-actions"><button class="btn btn-sm mp-btn mp-ok" data-queue-action="accept"><i class="fa fa-check"></i> [[mod-panel:accept]]</button>' +
					'<button class="btn btn-sm mp-btn mp-danger" data-queue-action="reject"><i class="fa fa-trash"></i> [[mod-panel:reject-post]]</button></div>' +
					'</div>';
			});
			paint(html + '</div>');
		}).catch(fail);
	}

	// ------------------------------------------------------------ bans
	function bansView() {
		api.get('/plugins/mod-panel/bans', {}).then(function (d) {
			setBadge('bans', d.items.length);
			if (!d.items.length) { return paint(empty('fa-face-smile', 'no-bans')); }
			let html = '<div class="mp-users">';
			d.items.forEach(function (u) {
				const avatar = u.picture ?
					'<img class="avatar avatar-rounded" style="--avatar-size:36px" src="' + esc(u.picture) + '" alt="">' :
					'<span class="avatar avatar-rounded" style="--avatar-size:36px;background-color:' + esc(u['icon:bgColor']) + '">' + esc(u['icon:text']) + '</span>';
				html += '<div class="mp-user" data-ban="' + esc(u.uid) + '">' + avatar +
					'<a href="' + rel + '/user/' + esc(u.userslug) + '">' + esc(u.username) + '</a>' +
					'<span class="mp-muted">' + (u.bannedUntil ? '[[mod-panel:banned-until]] ' + esc(new Date(u.bannedUntil).toLocaleDateString()) : '[[mod-panel:banned-forever]]') + '</span>' +
					'<button class="btn btn-sm mp-btn" data-unban><i class="fa fa-unlock"></i> [[mod-panel:unban]]</button></div>';
			});
			paint(html + '</div>');
		}).catch(fail);
	}

	// ------------------------------------------------------------ wiring
	function show(section) {
		current = section;
		$root.find('.mp-tab').removeClass('active').filter('[data-section="' + section + '"]').addClass('active');
		$root.find('[data-mp-body]').html('<div class="mp-loading"><i class="fa fa-spinner fa-spin"></i></div>');
		({ overview: overview, flags: flagsView, queue: queueView, bans: bansView }[section] || overview)();
	}

	ModPanel.init = function () {
		$root = $('[data-mod-panel]');
		const first = $root.find('.mp-tab').first().attr('data-section') || 'overview';

		$root.on('click', '.mp-tab', function () { show($(this).attr('data-section')); });
		$root.on('click', '[data-go]', function () { show($(this).attr('data-go')); });
		$root.on('click', '[data-flag-filter]', function () { flagState = $(this).attr('data-flag-filter'); flagPage = 1; flagsView(); });
		$root.on('click', '[data-flag-page]', function () { flagPage = parseInt($(this).attr('data-flag-page'), 10) || 1; flagsView(); });

		$root.on('click', '[data-flag-state]', function () {
			const $row = $(this).closest('[data-flag]');
			api.put('/plugins/mod-panel/flags/' + $row.attr('data-flag'), { state: $(this).attr('data-flag-state') }).then(function () {
				$row.fadeOut(200, function () { $row.remove(); });
				alerts.success('[[mod-panel:saved]]');
			}).catch(fail);
		});

		$root.on('click', '[data-queue-action]', function () {
			const $item = $(this).closest('[data-queue]');
			const action = $(this).attr('data-queue-action');
			api.post('/plugins/mod-panel/queue/' + encodeURIComponent($item.attr('data-queue')), { action: action }).then(function () {
				$item.fadeOut(200, function () { $item.remove(); });
				alerts.success(action === 'accept' ? '[[mod-panel:accepted]]' : '[[mod-panel:rejected]]');
			}).catch(fail);
		});

		$root.on('click', '[data-unban]', function () {
			const $u = $(this).closest('[data-ban]');
			api.del('/plugins/mod-panel/bans/' + $u.attr('data-ban'), {}).then(function () {
				$u.fadeOut(200, function () { $u.remove(); });
				alerts.success('[[mod-panel:unbanned]]');
			}).catch(fail);
		});

		show(first);
	};

	return ModPanel;
});
