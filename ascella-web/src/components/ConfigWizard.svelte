<script lang="ts">
  import DL from "svelte-material-icons/DownloadNetwork.svelte";
  let config: Record<string, any> = JSON.parse(localStorage.getItem("config") ?? "null") || {
    days: 30,
    style: 1,

    embed: {},
  };

  const a = document.createElement("a");

  let domains = fetch("https://api.ascella.host/api/v3/domains.json").then((r) => r.json());
</script>

<div class="p-4 rounded-sm">
  <h2 class="text-xl font-bold text-center animate-bounce">Ascella.host config creator</h2>
  <marquee>
    <p class="font-bold">Here you can create a config for Ascella.host</p>
  </marquee>
  <form
    class="grid grid-cols-4 gap-4"
    on:submit|preventDefault={() => {
      localStorage.setItem("config", JSON.stringify(config));

      const headers = {
        "ascella-autodelete": config.days.toString(),
        "ascella-style": config.style,
        "ascella-domain": `${config.subDomain ? `${config.subDomain}.` : ""}${config.domain}`,
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
        Headers: headers,
        Body: "MultipartFormData",
        FileFormName: "file",
        URL: "{json:url}",
        DeletionURL: "{json:deletion_url}",
        ErrorMessage: "{json:error}",
      };

      const json = JSON.stringify(file);
      const blob = new Blob([json], { type: "octet/stream" });
      const url = window.URL.createObjectURL(blob);
      a.href = url;
      a.download = "AscellaHost.sxcu";
      a.click();
      window.URL.revokeObjectURL(url);
    }}
  >
    <div class="form-control w-full col-span-4">
      <marquee direction="right" scrolldelay="2" scrollamount="2">
        <label>Select Domain</label>
      </marquee>
      <div class="flex gap-2 w-full">
        <input bind:value={config.subDomain} placeholder="subdomain" class="input input-primary rounded-sm" />
        <select bind:value={config.domain} class="select select-primary rounded-sm" required>
          {#await domains then domains}
            {#each domains as domain}
              <option>{domain.domain}</option>
            {/each}
          {/await}
        </select>
      </div>
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
      <input bind:value={config.embed.description} placeholder="description" class="input input-accent rounded-sm focus:translate-x-4" />
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
      <input bind:value={config.embed["author-url"]} placeholder="author-url" class="input input-accent rounded-sm focus:translate-y-2" />
    </div>
    <button type="submit" class="btn btn-primary col-span-4">
      <span class="animate-ping"><DL /></span>
      Download</button
    >
  </form>
</div>
