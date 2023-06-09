<script lang="ts">
  export const prerender = true;

  import OpenSource from "svelte-material-icons/CodeBrackets.svelte";
  import Fast from "svelte-material-icons/Speedometer.svelte";
  import Secure from "svelte-material-icons/ShieldLock.svelte";
  import Uptime from "svelte-material-icons/TimerSand.svelte";
  import Support from "svelte-material-icons/Headset.svelte";
  import Compatibility from "svelte-material-icons/ServerNetwork.svelte";
  import ArrowRight from "svelte-material-icons/ArrowRightBold.svelte";
  const features = [
    {
      name: "Open Source",
      icon: OpenSource,
      description: "Ascella is open source and free to use. You can contribute to the project on GitHub.",
    },
    {
      name: "Fast",
      icon: Fast,
      description:
        "Ascella is fully ran on <a href='https://cloudflare.com/'  class='link link-primary'  target='_blank'>Cloudflare</a> Workers and optimized for speed.",
    },
    {
      name: "Secure",
      icon: Secure,
      description: "Ascella images are not indexed by search engines",
    },
    {
      name: "Uptime",
      icon: Uptime,
      description:
        "Ascella is almost never down cause its hosted on the <a href='https://cloudflare.com/' class='link link-primary' target='_blank'>Cloudflare</a> Workers. <br>Ascella is fully up and running on <a href='https://cloudflare.com/' target='_blank'>Cloudflare</a> network",
    },
    {
      name: "Support",
      icon: Support,
      description: "We have give great support to our users in the Discord server",
    },
    {
      name: "Compatibility",
      icon: Compatibility,
      description: "Ascella is compatible with all major operating systems",
    },
  ];

  export let stats: Record<string, number>;

  import File from "svelte-material-icons/File.svelte";
  import Domain from "svelte-material-icons/Domain.svelte";
  import Eye from "svelte-material-icons/Eye.svelte";
  import User from "svelte-material-icons/FaceProfile.svelte";
  import Storage from "svelte-material-icons/Harddisk.svelte";
  import Link from "svelte-material-icons/Link.svelte";
  const statIconsAndRenames = {
    files: ["File's Uploaded", File],
    domains: ["Custom Domains", Domain],
    views: ["File views", Eye],
    users: ["Users", User],
    storageUsage: ["Storage Used", Storage, true],
    redirects: ["Redirects created", Link],
  } as any;
</script>

<div class="max-w-6xl mx-auto">
  <div class="flex flex-wrap gap-2 mx-auto px-auto justify-center mb-10">
    {#each features as feature}
      <div class="feature w-80 bg-base-200 p-4 rounded">
        <div class="">
          <h2 class="flex leading-none text-3xl mb-2 font-bold">
            <span class="mr-1"><svelte:component this={feature.icon} height="1em" /></span>
            {feature.name}
          </h2>
        </div>

        <div class="description">
          <p>
            {@html feature.description}
          </p>
        </div>
      </div>
    {/each}
  </div>
  <div>
    <a href="/config_wizard" class="link link-primary text-3xl py-3 no-underline flex">
      <span class="my-auto">
        <ArrowRight />
      </span>
      Create config</a
    >
  </div>

  <hr class="py-5" />
  <div>
    <h2 class="text-3xl font-bold m-2">Stats</h2>
    <div class="flex gap-2">
      {#each Object.entries(stats).filter((x) => statIconsAndRenames[x[0]]) as [key, value]}
        <div class="stat w-80 bg-base-200 p-4 rounded">
          <div class="flex">
            <h2 class="flex leading-none mb-2 gap-1">
              <svelte:component this={statIconsAndRenames[key][1]} height="1em" />
              {statIconsAndRenames[key][0]}
            </h2>
          </div>
          <div class="description font-bold text-3xl">
            <p>
              {#if statIconsAndRenames[key][2] == true}
                {new Intl.NumberFormat("en", {
                  unit: "megabyte",
                  style: "unit",
                  unitDisplay: "short",
                  notation: "compact",
                }).format((value / 1000000) | 0)}
              {:else}
                {new Intl.NumberFormat("en", {
                  notation: "compact",
                }).format(value)}
              {/if}
            </p>
          </div>
        </div>
      {/each}
    </div>
  </div>
  <hr class="py-5 mt-10" />
</div>
