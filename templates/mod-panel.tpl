<div class="mod-panel" data-mod-panel style="--mp-accent: {accent};">
	<div class="mp-hero">
		<div class="mp-hero-icon"><i class="fa fa-shield"></i></div>
		<div class="mp-hero-text">
			<h1 class="mp-title">{{{ if panelTitle }}}{panelTitle}{{{ else }}}[[mod-panel:title]]{{{ end }}}</h1>
			<p class="mp-sub">[[mod-panel:subtitle]]{{{ if scoped }}} · [[mod-panel:scoped]]{{{ end }}}</p>
		</div>
	</div>

	<ul class="mp-tabs nav" role="tablist">
		{{{ if sections.overview }}}<li class="nav-item"><button class="mp-tab active" data-section="overview" type="button"><i class="fa fa-gauge"></i> [[mod-panel:tab-overview]]</button></li>{{{ end }}}
		{{{ if sections.flags }}}<li class="nav-item"><button class="mp-tab" data-section="flags" type="button"><i class="fa fa-flag"></i> [[mod-panel:tab-flags]] <span class="mp-badge" data-count="flags"></span></button></li>{{{ end }}}
		{{{ if sections.queue }}}<li class="nav-item"><button class="mp-tab" data-section="queue" type="button"><i class="fa fa-list-check"></i> [[mod-panel:tab-queue]] <span class="mp-badge" data-count="queue"></span></button></li>{{{ end }}}
		{{{ if sections.bans }}}<li class="nav-item"><button class="mp-tab" data-section="bans" type="button"><i class="fa fa-ban"></i> [[mod-panel:tab-bans]] <span class="mp-badge" data-count="bans"></span></button></li>{{{ end }}}
	</ul>

	<div class="mp-body" data-mp-body>
		<div class="mp-loading"><i class="fa fa-spinner fa-spin"></i></div>
	</div>

	<div class="mp-credit">
		[[mod-panel:credit-prefix]] <a href="https://meatsvim.top" target="_blank" rel="noopener">מעצבים טופ</a>
	</div>
</div>
