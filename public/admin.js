'use strict';

/* Mod Panel — admin settings page. Built by מעצבים טופ (https://meatsvim.top) */

define('admin/plugins/mod-panel', ['alerts'], function (alerts) {
	const Admin = {};
	const SECTIONS = ['overview', 'flags', 'queue', 'bans'];
	const DEFAULT_ACCENT = '#a67c2e';

	Admin.init = function () {
		let settings = {};
		try {
			settings = JSON.parse($('#mp-settings').text() || '{}');
		} catch (e) {
			settings = {};
		}

		$('#mp-title').val(settings.title || '');
		$('#mp-accent').val(settings.accent || DEFAULT_ACCENT);
		SECTIONS.forEach(function (section) {
			const chosen = String(settings[section + 'Groups'] || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
			$('[data-section="' + section + '"] input[type="checkbox"]').each(function () {
				this.checked = chosen.indexOf(this.value) !== -1;
			});
		});

		$('#mp-accent-reset').on('click', function () {
			$('#mp-accent').val(DEFAULT_ACCENT);
		});

		$('#mp-save').on('click', function () {
			const values = {
				title: String($('#mp-title').val() || '').trim(),
				accent: $('#mp-accent').val() || DEFAULT_ACCENT,
			};
			SECTIONS.forEach(function (section) {
				values[section + 'Groups'] = $('[data-section="' + section + '"] input:checked').map(function () {
					return this.value;
				}).get().join(',');
			});
			socket.emit('admin.settings.set', { hash: 'mod-panel', values: values }, function (err) {
				if (err) {
					return alerts.error(err);
				}
				alerts.success('[[mod-panel:saved]]');
			});
		});
	};

	return Admin;
});
