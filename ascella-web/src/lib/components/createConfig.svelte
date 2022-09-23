<script lang="ts">
	import { onMount } from 'svelte';
	// import { Styles } from 'ascella-common';
	let config: Record<string, any> = {
		days: 30,
		embed: {}
	};

	onMount(async () => {
		config = JSON.parse(localStorage.getItem('config')) || { ...config };
	});
	export let getHeaderDefaults = (user: Record<string, any>, headers: Headers) => {
		let defaults: Record<string, any> = {
			...user
		};
		['domain', 'append', 'vanity', 'ext'].forEach(
			(x) => (defaults[x] = headers.get(`x-ascella-${x}`) || defaults[x])
		);
		let style = parseInt(headers.get('x-ascella-style')!);
		if (style) {
			defaults.url_style = style;
		}
		let autodelete = parseInt(headers.get('x-ascella-autodelete')!);
		if (autodelete) {
			defaults.autodelete = autodelete;
		}
		let length = parseInt(headers.get('x-ascella-vanity-length')!);
		if (length) {
			defaults.length = length;
		}
		defaults.embed = {};

		['color', 'title', 'description', 'sitename', 'sitename-url', 'author', 'author-url'].forEach(
			(x) => {
				let val = headers.get(`x-ascella-og-${x}`);
				if (val) defaults.embed[x] = val;
			}
		);

		return defaults;
	};
</script>

<div>
	<h2>Ascella.host config creator</h2>
	<p>Here you can create a config for Ascella.host</p>
	<form>
		<div class="form-control w-full">
			<label>Select Domain</label>
			<div class="flex gap-2">
				<input
					bind:value={config.subDomain}
					placeholder="subdomain"
					class="input input-accent rounded-sm"
				/>
				<select bind:value={config.domain} class="select select-accent rounded-sm" required>
					<option>Ascella.host</option>
				</select>
			</div>
		</div>

		<div class="form-control w-full">
			<p>Auto Delete Image days {config.days}</p>
			<input
				bind:value={config.days}
				type="range"
				min="1"
				max="365"
				class="range range-secondary"
			/>
		</div>
		<div class="form-control w-full">
			<select bind:value={config.style} class="select select-accent rounded-sm" required>
				<option>Ascella.host</option>
			</select>
		</div>
		<div class="form-control w-full">
			<label>Append</label>
			<input
				bind:value={config.append}
				placeholder="append"
				class="input input-accent rounded-sm"
			/>
		</div>

		<div class="form-control w-full">
			<label>Custom Vanity Length</label>
			<input
				bind:value={config.length}
				placeholder="length"
				class="input input-accent rounded-sm"
			/>
		</div>
		<div class="form-control w-full">
			<label>Custom Extension</label>
			<input bind:value={config.ext} placeholder="ext" class="input input-accent rounded-sm" />
		</div>
		<div class="form-control w-full">
			<label>Embed Title</label>
			<input
				bind:value={config.embed.title}
				placeholder="title"
				class="input input-accent rounded-sm"
			/>
		</div>
		<div class="form-control w-full">
			<label>Embed Description</label>
			<input
				bind:value={config.embed.description}
				placeholder="description"
				class="input input-accent rounded-sm"
			/>
		</div>
		<div class="form-control w-full">
			<label>Embed Color</label>
			<input
				bind:value={config.embed.color}
				placeholder="color"
				class="input input-accent rounded-sm"
			/>
		</div>
		<div class="form-control w-full">
			<label>Embed Site Name</label>
			<input
				bind:value={config.embed.sitename}
				placeholder="sitename"
				class="input input-accent rounded-sm"
			/>
		</div>
		<div class="form-control w-full">
			<label>Embed Site Name URL</label>
			<input
				bind:value={config.embed['sitename-url']}
				placeholder="sitename-url"
				class="input input-accent rounded-sm"
			/>
		</div>
		<div class="form-control w-full">
			<label>Embed Author</label>
			<input
				bind:value={config.embed.author}
				placeholder="author"
				class="input input-accent rounded-sm"
			/>
		</div>
		<div class="form-control w-full">
			<label>Embed Author URL</label>
			<input
				bind:value={config.embed['author-url']}
				placeholder="author-url"
				class="input input-accent rounded-sm"
			/>
		</div>
		<div class="form-control w-full">
			<label>Embed Image</label>
			<input
				bind:value={config.embed.image}
				placeholder="image"
				class="input input-accent rounded-sm"
			/>
		</div>
		<div class="form-control w-full">
			<label>Embed Thumbnail</label>
			<input
				bind:value={config.embed.thumbnail}
				placeholder="thumbnail"
				class="input input-accent rounded-sm"
			/>
		</div>
		<div class="form-control w-full">
			<label>Embed Footer</label>
			<input
				bind:value={config.embed.footer}
				placeholder="footer"
				class="input input-accent rounded-sm"
			/>
		</div>
		<div class="form-control w-full">
			<label>Embed Footer URL</label>
			<input
				bind:value={config.embed['footer-url']}
				placeholder="footer-url"
				class="input input-accent rounded-sm"
			/>
		</div>
		<div class="form-control w-full">
			<label>Embed Footer Icon</label>
			<input
				bind:value={config.embed['footer-icon']}
				placeholder="footer-icon"
				class="input input-accent rounded-sm"
			/>
		</div>
		<div class="form-control w-full">
			<label>Embed Timestamp</label>
			<input
				bind:value={config.embed.timestamp}
				placeholder="timestamp"
				class="input input-accent rounded-sm"
			/>
		</div>
	</form>
</div>
