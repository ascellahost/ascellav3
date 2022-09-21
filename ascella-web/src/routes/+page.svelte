<script lang="ts">
	// @ts-nocheck
	import OpenSource from 'svelte-material-icons/CodeBrackets.svelte';
	import Fast from 'svelte-material-icons/Speedometer.svelte';
	import Secure from 'svelte-material-icons/ShieldLock.svelte';
	import Uptime from 'svelte-material-icons/TimerSand.svelte';
	import Support from 'svelte-material-icons/Headset.svelte';
	import Compatibility from 'svelte-material-icons/ServerNetwork.svelte';
	const features = [
		{
			name: 'Open Source',
			icon: OpenSource,
			description:
				'Ascella is open source and free to use. You can contribute to the project on GitHub.'
		},
		{
			name: 'Fast',
			icon: Fast,
			description: 'Ascella is fully ran on Cloudflare Workers and optimized for speed.'
		},
		{
			name: 'Secure',
			icon: Secure,
			description: 'Ascella images are not indexed by search engines'
		},
		{
			name: 'Uptime',
			icon: Uptime,
			description: 'Asccella is never down cause its hosted on the Cloudflare network'
		},
		{
			name: 'Support',
			icon: Support,
			description: 'We have give great support to our users'
		},
		{
			name: 'Compatibility',
			icon: Compatibility,
			description: 'Ascella is compatible with all major operating systems'
		}
	];
	const stats = {
		files: 200,
		domains: 100,
		views: 320,
		users: 20,
		storageUsage: 10000,
		redirects: 1000
	};
	import File from 'svelte-material-icons/File.svelte';
	import Domain from 'svelte-material-icons/Domain.svelte';
	import Eye from 'svelte-material-icons/Eye.svelte';
	import User from 'svelte-material-icons/FaceProfile.svelte';
	import Storage from 'svelte-material-icons/Harddisk.svelte';
	import Link from 'svelte-material-icons/Link.svelte';
	const statIconsAndRenames = {
		files: ["File's Uploaded", File],
		domains: ['Custom Domains', Domain],
		views: ['File views', Eye],
		users: ['Users', User],
		storageUsage: ['Storage Used', Storage, true],
		redirects: ['Redirects created', Link]
	};
</script>

<div>
	<p>Ascella.host</p>
</div>
<div class="max-w-6xl mx-auto">
	<div class="flex flex-wrap gap-2 mx-auto px-auto">
		{#each features as feature}
			<div class="feature w-80 bg-base-200 p-4 rounded-sm">
				<div class="">
					<h2 class="flex leading-none text-3xl mb-2 font-bold">
						<svelte:component this={feature.icon} height="1em" />
						{feature.name}
					</h2>
				</div>

				<div class="description">
					<p>
						{feature.description}
					</p>
				</div>
			</div>
		{/each}
	</div>
	<hr class="py-5" />
	<div>
		<h2 class="text-3xl font-bold">Stats</h2>
		<div class="flex">
			{#each Object.entries(stats) as [key, value]}
				<div class="stat w-80 bg-base-200 p-4 border-2">
					<div class="flex">
						<h2 class="flex leading-none mb-2 gap-1">
							<svelte:component this={statIconsAndRenames[key][1]} height="1em" />
							{statIconsAndRenames[key][0]}
						</h2>
					</div>
					<div class="description font-bold text-3xl">
						<p>
							{#if statIconsAndRenames[key][2] == true}
								{new Intl.NumberFormat('en', {
									unit: 'kilobyte',
									style: 'unit',
									unitDisplay: 'short'
								}).format(value)}
							{:else}
								{new Intl.NumberFormat('en', {
									notation: 'compact'
								}).format(value)}
							{/if}
						</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
