'use strict';

/* Mod Panel — admin settings page. Built by מעצבים טופ (https://meatsvim.top) */

define('admin/plugins/mod-panel', ['alerts', 'translator'], function (alerts, translator) {
	const Admin = {};
	const SECTIONS = ['overview', 'flags', 'queue', 'bans'];
	const DEFAULT_ACCENT = '#a67c2e';

	Admin.init = function () {
		const page = document.querySelector('.mod-panel-admin');
		if (page && page.innerHTML.indexOf('[[mod-panel:') !== -1) {
			// translate the static texts first (works on every NodeBB 3/4 version), then wire the form
			return translator.translate(page.innerHTML, function (out) {
				page.innerHTML = out;
				setup();
			});
		}
		setup();
	};

	function setup() {
		let settings = {};
		try {
			settings = JSON.parse($('#mp-data').attr('data-settings') || '{}');
		} catch (e) {
			settings = {};
		}

		let groupNames = [];
		try {
			groupNames = JSON.parse($('#mp-data').attr('data-groups') || '[]');
		} catch (e) {
			groupNames = [];
		}
		SECTIONS.forEach(function (section) {
			const $box = $('[data-section="' + section + '"]').empty();
			groupNames.forEach(function (name) {
				const $label = $('<label class="form-check mb-0"></label>');
				$('<input class="form-check-input" type="checkbox">').val(name).appendTo($label);
				$('<span class="form-check-label"></span>').text(name).appendTo($label);
				$box.append($label);
			});
		});

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
	}

	return Admin;
});
