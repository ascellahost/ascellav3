<script lang="ts">
  export let url: URL;
  let { vanity, d: del, url: urls } = Object.fromEntries(url.searchParams.entries());
  let borders = false;

  let input: HTMLInputElement;
</script>

<div class="flex justify-center max-w-full max-h-full">
  {#await fetch(`https://api.ascella.host/api/v3/files/${vanity}`).then((r) => r.json())}
    <p>Loading..</p>
  {:then result}
    {#if result.raw}
      <a href={`/v/${vanity}`}>
        <div
          class={borders
            ? "bg-gradient-to-bl from-primary to-secondary rounded-md p-2 duration-1000 hover:bg-gradient-to-l hover:from-secondary hover:to-primary"
            : ""}
        >
          <img
            on:load={() => (borders = true)}
            src={result.raw}
            alt="bro who be using Ascella without vision :skull:"
            class="p-2 bg-base-100"
          />
        </div>
      </a>
    {:else}
      <p>Failed to load image</p>
    {/if}
  {:catch error}
    <p>
      {JSON.stringify(error)}
    </p>
  {/await}
</div>
{#if del}
  <div class="flex justify-center p-2">
    <a class="link link-primary" href={del?.startsWith("https://") ? del : `https://api.ascella.host/api/v3/files/${vanity}/delete/${del}`}
      >Delete This Image</a
    >
  </div>
{/if}
{#if urls}
  <div class="flex justify-center p-2">
    <input class="input input-ghost mx-2" bind:this={input} on:input={(e) => (e.target.value = urls)} value={urls} />
    <button
      class="btn btn-ghost mx-2"
      on:click={() => {
        input.select();
        document.execCommand("copy");
        input.blur();
        navigator.clipboard.writeText(input.value);
      }}>Copy</button
    >
  </div>
{/if}
