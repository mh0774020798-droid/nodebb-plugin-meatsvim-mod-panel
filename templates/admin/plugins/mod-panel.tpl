<div class="acp-page-container mod-panel-admin">
	<div component="settings/main/header" class="row border-bottom py-2 m-0 sticky-top acp-page-main-header align-items-center">
		<div class="col-12 col-md-8 px-0 mb-1 mb-md-0">
			<h4 class="fw-bold tracking-tight mb-0"><i class="fa fa-shield text-warning"></i> [[mod-panel:admin-title]]</h4>
		</div>
		<div class="col-12 col-md-4 px-0 px-md-3 text-md-end">
			<button id="mp-save" class="btn btn-primary btn-sm fw-semibold ff-secondary w-100 text-center text-nowrap">[[admin/admin:save-changes]]</button>
		</div>
	</div>

	<div class="row m-0">
		<div class="col-12 col-md-8 px-0 px-md-3 py-3">
			<script type="application/json" id="mp-settings">{settingsJSON}</script>

			<div class="mb-4">
				<h5 class="fw-bold tracking-tight settings-header">[[mod-panel:admin-look]]</h5>
				<div class="mb-3">
					<label class="form-label" for="mp-title">[[mod-panel:admin-panel-title]]</label>
					<input type="text" id="mp-title" class="form-control" placeholder="[[mod-panel:title]]">
				</div>
				<div class="mb-3">
					<label class="form-label" for="mp-accent">[[mod-panel:admin-accent]]</label>
					<div class="d-flex gap-2 align-items-center">
						<input type="color" id="mp-accent" class="form-control form-control-color" value="#a67c2e">
						<button type="button" class="btn btn-light btn-sm" id="mp-accent-reset">[[mod-panel:admin-accent-reset]]</button>
					</div>
					<p class="form-text">[[mod-panel:admin-accent-help]]</p>
				</div>
			</div>

			<div class="mb-4">
				<h5 class="fw-bold tracking-tight settings-header">[[mod-panel:admin-permissions]]</h5>
				<p class="form-text mb-3">[[mod-panel:admin-permissions-help]]</p>
				{{{ each sections }}}
				<div class="card mb-3">
					<div class="card-header fw-semibold">[[mod-panel:tab-{./id}]]</div>
					<div class="card-body d-flex flex-wrap gap-3" data-section="{./id}">
						{{{ each ../groups }}}
						<label class="form-check mb-0">
							<input class="form-check-input" type="checkbox" value="{./name}">
							<span class="form-check-label">{./name}</span>
						</label>
						{{{ end }}}
					</div>
				</div>
				{{{ end }}}
			</div>

			<p class="text-muted small">[[mod-panel:credit-prefix]] <a href="https://meatsvim.top" target="_blank" rel="noopener">מעצבים טופ</a></p>
		</div>
	</div>
</div>
