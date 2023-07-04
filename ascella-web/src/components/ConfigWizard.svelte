<script lang="ts">
  import DL from "svelte-material-icons/DownloadNetwork.svelte";
  import OpenInNew from "svelte-material-icons/OpenInNew.svelte";
  import { emptyConfig, getConfig, getHeadersFromConfig } from "../utils";

  let config: Record<string, any> = getConfig();

  const a = document.createElement("a"); // dummy <a> element to download the config file

  let domains = fetch("https://api.ascella.host/api/v3/domains.json").then((r) => r.json());

  let uploadToDesktop = false;

  let error = "";

  let agreed_to_tos = false;

  let domain = config.meta_domain; // can be "custom" for a user defined domain, or a domain from the domains api

  let subdomain = config.meta_subdomain; // the custom subdomain for a domain from the domains api

  function save(): void {
    console.log("saving config to localstorage");
    config.meta_domain = domain;
    config.meta_subdomain = subdomain;
    localStorage.setItem("config", JSON.stringify(config));
  }

  async function submit(): Promise<void> {
    error = "";

    // check if the user has accepted the rules
    if (!agreed_to_tos) {
      error = "You must accept the rules";
      return;
    }

    // assemble the domain
    if (domain === "custom") {
      config.domain = config.domain;
    } else {
      if (!subdomain.endsWith(".") && subdomain !== "") {
        subdomain += ".";
      }
      config.domain = subdomain + domain;
    }

    // save to session storage
    save();

    // download or upload the config
    const file = {
      ...emptyConfig,
      Headers: getHeadersFromConfig(config),
    };

    if (uploadToDesktop) {
      try {
        const result = await fetch("http://localhost:3234", {
          method: "POST",
          body: JSON.stringify(file),
        });
        if (!result.ok) {
          error = `${result.status} : ${result.statusText}`;
        }
      } catch (e) {
        if (e.message === "NetworkError when attempting to fetch resource.") {
          error = "Failed to connecting to the desktop app";
        } else {
          error = e.message;
        }
      }
      uploadToDesktop = false;
    } else {
      const json = JSON.stringify(file);
      const blob = new Blob([json], { type: "octet/stream" });
      // @ts-ignore
      const url = window.URL.createObjectURL(blob); // ts doesn't know about window.URL again
      a.href = url;
      a.download = "AscellaHost.sxcu";
      a.click();
      // @ts-ignore
      window.URL.revokeObjectURL(url); // ts doesn't know about window.URL again
    }
  }
</script>

<div class=" sm:max-w-full rounded-sm">
  <h2 class="text-xl font-bold text-center">Ascella.host config creator</h2>
  <marquee>
    <p class="font-bold">Create a config for Ascella.host now!!</p>
  </marquee>
  <div class="flex mh-12 justify-center min-w-full text-red-950 bg-yellow-200 transition-all">{error}</div>
  <form
    on:change={() => {
      save();
    }}
    class="flex flex-wrap md:grid md:grid-cols-4 gap-4"
    on:submit|preventDefault={async () => {
      await submit();
    }}
  >
    <div class="form-control w-full col-span-2">
      <marquee direction="right" scrolldelay="2" scrollamount="2">
        <label>Select Domain</label>
      </marquee>
      <div class="grid grid-cols-2 gap-2 w-full">
        {#if domain === "custom"}
          <a target="_blank" href="/custom-domain-help" class="col-span-2">
            How to set up your domain for Ascella
            <OpenInNew class="inline-block" />
          </a>

          <input class="input input-primary rounded-sm" bind:value={config.domain} placeholder="your.domain.com" />
        {:else}
          <p class="col-span-2">Optional custom subdomain</p>

          <input
            pattern="^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$"
            class="input input-primary rounded-sm"
            placeholder="subdomain."
            bind:value={subdomain}
            on:focusout={() => {
              if (!subdomain.endsWith(".") && subdomain !== "") {
                subdomain += ".";
              }
            }}
          />
        {/if}

        <select
          bind:value={domain}
          on:change={() => {
            if (domain === "custom") {
              config.domain = "";
            } else {
              config.domain = domain;
            }
          }}
          class="select select-primary rounded-sm"
          required
        >
          {#await domains then domains}
            {#each domains as domain}
              <option selected={domain === domain.domain}>{domain.domain}</option>
            {/each}
          {/await}
          <option value="custom" selected={domain === "custom"}>Custom</option>
        </select>
      </div>
    </div>
    <div class="form-control w-full my-2 col-span-2">
      <label class="animate-pulse">Ascella token</label>
      <p class="float-left">
        A ascella token allows you to upload bigger files & keep a history of files you can obtain one from
        <a href="https://api.ascella.host/oauth/auth" class="link link-primary link-hover">
          logging in here with discord
          <OpenInNew class="inline-block align-middle" />
        </a>
      </p>
      <input bind:value={config.token} placeholder="ascella-token" class="input input-accent rounded-sm focus:translate-x-4" />
    </div>
    <div class="form-control w-full col-span-2">
      <p>Auto Delete Image days {config.days}</p>
      <input
        aria-label="Auto delete days silder"
        bind:value={config.days}
        type="range"
        min="1"
        max="365"
        class="range range-secondary hover:range-primary duration-500"
      />
    </div>
    <div class="form-control w-full my-2 col-span-2">
      <label class="animate-ping animate-pulse">Url Style</label>
      <select bind:value={config.style} class="select select-accent rounded-sm focus:select-ghost" required>
        <option value="1">Default</option>
        <option value="2">Uuid</option>
        <option value="3">timestamp</option>
        <option value="4">Ulid</option>
        <option value="5">Emoji</option>
        <option value="6">Filename</option>
      </select>
    </div>
    <details class="col-span-4">
      <summary> Advanced options</summary>
      <div class="grid grid-cols-4 gap-4">
        <div class="form-control w-full my-2 col-span-2">
          <label class="animate-pulse">Append</label>
          <input bind:value={config.append} placeholder="append" class="input input-accent rounded-sm focus:translate-x-4" />
        </div>

        <div class="form-control w-full my-2 col-span-1">
          <label class="animate-pulse">Custom Vanity Length</label>
          <input bind:value={config.length} type="number" placeholder="length" class="input input-accent rounded-sm focus:translate-y-4" />
        </div>

        <div class="form-control w-full my-2 col-span-1">
          <label class="animate-pulse">Custom Extension</label>
          <input bind:value={config.ext} placeholder="ext" class="input input-accent rounded-sm focus:translate-x-8" />
        </div>

        <div class="form-control w-full my-2">
          <label class="animate-pulse">Embed Title</label>
          <input bind:value={config.embed.title} placeholder="title" class="input input-accent rounded-sm focus:translate-y-4" />
        </div>

        <div class="form-control w-full my-2 col-span-2">
          <label class="animate-pulse">Embed Description</label>
          <input
            bind:value={config.embed.description}
            placeholder="description"
            class="input input-accent rounded-sm focus:translate-x-4"
          />
        </div>

        <div class="form-control w-full my-2">
          <label class="animate-pulse">Embed Color</label>
          <input bind:value={config.embed.color} placeholder="color" class="input input-accent rounded-sm focus:translate-y-10" />
        </div>

        <div class="form-control w-full my-2">
          <label class="animate-pulse">Embed Site Name</label>
          <input bind:value={config.embed.sitename} placeholder="sitename" class="input input-accent rounded-sm focus:translate-y-2" />
        </div>

        <div class="form-control w-full my-2">
          <label class="animate-pulse">Embed Site Name URL</label>
          <input
            bind:value={config.embed["sitename-url"]}
            placeholder="sitename-url"
            class="input input-accent rounded-sm focus:translate-y-2"
          />
        </div>

        <div class="form-control w-full my-2">
          <label class="animate-pulse">Embed Author</label>
          <input bind:value={config.embed.author} placeholder="author" class="input input-accent rounded-sm focus:translate-y-2" />
        </div>

        <div class="form-control w-full my-2">
          <label class="animate-pulse">Embed Author URL</label>
          <input
            bind:value={config.embed["author-url"]}
            placeholder="author-url"
            class="input input-accent rounded-sm focus:translate-y-2"
          />
        </div>
      </div>
    </details>

    <div class="w-full col-span-4">
      <label class="cursor-pointer max-w-2xl">
        <input
          bind:checked={agreed_to_tos}
          type="checkbox"
          class="checkbox border-gray-400 ease-in-out duration-400 transition-colors checkbox-error"
        />
        <span class="label-text">
          I accept the ascella
          <a href="/rules" target="_blank" class="underline">
            rules
            <OpenInNew class="inline-block align-middle " />
          </a>
        </span>
      </label>
    </div>
    <button type="submit" class="btn btn-primary col-span-3">
      <span class="animate-ping"><DL /></span>
      <span> Download Config (.sxcu) </span>
    </button>
    <button name="xy-type" value="desktop" type="submit" class="btn btn-primary col-span-1" on:click={() => (uploadToDesktop = true)}>
      <span> Upload config to ascella desktop </span>
    </button>
  </form>
  <div class="py-3 text-center">
    <p class="col-span-2">
      On linux or mac without sharex? no problem try out
      <a href="https://github.com/ascellahost/gui" class="link link-hover link-secondary" on:click={save} target="_blank">
        The desktop app <OpenInNew class="inline-block align-middle " />
      </a>
    </p>
    <a href="/upload" on:click={save} class="link link-hover link-primary font-extrabold text-xl"
      >Or try the web version <OpenInNew class="inline-block align-middle " /></a
    >
  </div>
</div>

<style>
  /* KINDLY STOLEN FROM https://css-tricks.com/how-to-animate-the-details-element/*/

  summary {
    padding: 1rem;
    display: block;
    padding-left: 2.2rem;
    position: relative;
    cursor: pointer;
  }

  summary:before {
    content: "";
    border-width: 0.4rem;
    border-style: solid;
    border-color: transparent transparent transparent #fff;
    position: absolute;
    top: 1.3rem;
    left: 1rem;
    transform: rotate(0);
    transform-origin: 0.2rem 50%;
    transition: 0.25s transform ease;
  }

  details[open] > summary:before {
    transform: rotate(90deg);
  }
</style>
