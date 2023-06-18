<script lang="ts">
  export let url = new URL(window.location.href);
  let { d: del, c: urls } = Object.fromEntries(url.searchParams.entries());
  let borders = false;
  let vanity = urls.split("/").at(-1)?.split(".")[0];

  let input: HTMLInputElement;
</script>

<div class="flex justify-center max-w-full max-h-full">
  {#await fetch(`https://api.ascella.host/api/v3/files/${vanity}`).then((r) => r.json())}
    <p>Loading..</p>
  {:then result}
    {#if result.raw}
      <a href={`/v/${vanity}`}>
        <div class={borders ? "background-animate bg-gradient-to-l from-primary to-secondary rounded-md p-2" : ""}>
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
    <input class="input input-ghost mx-2 w-96" bind:this={input} on:input={(e) => (e.target.value = urls)} value={urls} />
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

<style>
  .background-animate {
    background-size: 200%;
    -webkit-animation: AnimateBackgroud 2s ease infinite;
    -moz-animation: AnimateBackgroud 2s ease infinite;
    animation: AnimateBackgroud 2s ease infinite;
  }

  @keyframes AnimateBackgroud {
    20% {
      background-position: 0;
    }

    50% {
      background-position: 100%;
    }

    80% {
      background-position: 0;
    }
  }
</style>
