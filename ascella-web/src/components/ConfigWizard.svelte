<script lang="ts">
  import DL from "svelte-material-icons/DownloadNetwork.svelte";
  let config: Record<string, any> = JSON.parse(localStorage.getItem("config") ?? "null") || {
    days: 30,
    style: 1,
    domain: "is-a-huge.monster",

    embed: {},
  };

  const a = document.createElement("a");

  let domains = fetch("https://api.ascella.host/api/v3/domains.json").then((r) => r.json());

  let uploadToDesktop = false;

  let error = "";
</script>

<div class="p-4 rounded-sm">
  <h2 class="text-xl font-bold text-center animate-bounce">Ascella.host config creator</h2>
  <marquee>
    <p class="font-bold">Here you can create a config for Ascella.host</p>
  </marquee>
  <span class="text-red-950 bg-yellow-200">{error}</span>
  <form
    class="grid grid-cols-4 gap-4"
    on:submit|preventDefault={async (r) => {
      localStorage.setItem("config", JSON.stringify(config));
      const headers = {
        "ascella-autodelete": config.days.toString(),
        "ascella-style": config.style,
        "ascella-token": config.token,
        "ascella-domain": `${config.subDomain ? `${config.subDomain}.` : ""}${config.domain_custom ?? config.domain}`,
        ...Object.fromEntries(
          Object.entries(config.embed)
            .filter((x) => x[1] !== "")
            .map((x) => [`ascella-og-${x[0]}`, x[1]?.toString()])
        ),
      };

      const file = {
        Version: "14.0.0",
        Name: "Ascella.host - Images",
        DestinationType: "ImageUploader",
        RequestMethod: "POST",
        RequestURL: "https://api.ascella.host/api/v3/upload",
        Headers: Object.fromEntries(Object.entries(headers).filter((x) => x[1] !== "")),
        Body: "MultipartFormData",
        FileFormName: "file",
        URL: "{json:url}",
        DeletionURL: "{json:deletion_url}",
        ErrorMessage: "{json:error}",
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
          //@ts-ignore -
          error = e.message;
        }
        uploadToDesktop = false;
        return;
      }

      const json = JSON.stringify(file);
      const blob = new Blob([json], { type: "octet/stream" });
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = "AscellaHost.sxcu";
      a.click();
      window.URL.revokeObjectURL(url);
    }}
  >
    <div class="form-control w-full col-span-2">
      <marquee direction="right" scrolldelay="2" scrollamount="2">
        <label>Select Domain</label>
      </marquee>
      <div class="flex gap-2 w-full">
        <input bind:value={config.subDomain} placeholder="subdomain" class="input input-primary rounded-sm" />
        <select bind:value={config.domain} class="select select-primary rounded-sm" required>
          {#await domains then domains}
            {#each domains as domain}
              <option selected={config.domain === domain.domain}>{domain.domain}</option>
            {/each}
          {/await}
          <option value="custom" selected={config.domain === "custom"}>Custom</option>
        </select>
      </div>
      {#if config.domain === "custom"}
        <div class="form-control w-full my-2 col-span-2">
          <label class="animate-pulse">Custom Domain</label>
          <input bind:value={config.domain_custom} placeholder="domain" class="input input-accent rounded-sm focus:translate-x-4" />
        </div>
      {/if}
    </div>
    <div class="form-control w-full my-2 col-span-2">
      <label class="animate-pulse">Ascella token</label>
      <p>
        A ascella token allows you to upload bigger files & keep a history of files you can obtain one from <a
          href="https://api.ascella.host/oauth/auth"
          class="link link-primary link-hover"
        >
          here
        </a> make sure to save it cause it regenerates each time you login
      </p>
      <input bind:value={config.token} placeholder="ascella-token" class="input input-accent rounded-sm focus:translate-x-4" />
    </div>
    <div class="form-control w-full col-span-2">
      <p>Auto Delete Image days {config.days}</p>
      <input bind:value={config.days} type="range" min="1" max="365" class="range range-secondary hover:range-primary duration-500" />
    </div>
    <div class="form-control w-full my-2 col-span-2">
      <label class="animate-bounce">Url Style</label>
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
      <summary> Advanced options </summary>
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

    <div class="form-control w-full my-2 flex col-span-4">
      <label class="cursor-pointer label w-52">
        <input type="checkbox" class="checkbox checkbox-error" />
        <span class="label-text"> <a href="/rules">I accept the ascella rules</a></span>
      </label>
    </div>
    <button type="submit" class="btn btn-primary col-span-3">
      <span class="animate-ping"><DL /></span>
      <span> Download </span>
    </button>
    <button name="xy-type" value="desktop" type="submit" class="btn btn-primary col-span-1" on:click={() => (uploadToDesktop = true)}>
      <span> Upload config to ascella desktop </span>
    </button>
    <p class="col-span-2">
      On linux or mac without sharex? no problem try out <a
        href="https://github.com/ascellahost/gui"
        class="link link-hover link-secondary"
        target="_blank">The desktop app</a
      >
    </p>
  </form>
</div>
