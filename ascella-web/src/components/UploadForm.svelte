<script lang="ts">
  import { emptyConfig, getConfig, getHeadersFromConfig } from "../utils";
  import { onMount } from "svelte";

  let progress = -1;

  let fileInputElement: HTMLInputElement;

  onMount(() => {

    if ("launchQueue" in window) {
      window.launchQueue.setConsumer((launchParams) => {
        if (launchParams.files && launchParams.files.length) {
          fileInputElement.files = launchParams.files;
        }
      });
    }

    window.onbeforeunload = s => (fileInputElement.value && progress <= 99) ? "" : null;
  });

  async function handleFormSubmit(event: SubmitEvent) {

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", e => {
      progress = (e.loaded / e.total) * 100;
    });

    xhr.open("POST", emptyConfig.RequestURL, true);

    const headers = getHeadersFromConfig(getConfig());

    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(encodeURI(key), encodeURI(value));
    }

    //@ts-ignore
    xhr.send(new FormData(event.target));

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const json = JSON.parse(xhr.responseText);
        window.location.href = `/success?d=${json.delete}&c=${json.url}`;
      } else {
        console.error(xhr.responseText);
      }

    };

  }

  let uploadDisabled = true;


  function updateButton() {
    uploadDisabled = !fileInputElement.files.length || progress !== -1;
  }


</script>

<form on:submit|preventDefault={handleFormSubmit} class="mx-auto grid max-w-lg gap-2">
  <input on:dragover|preventDefault on:dragenter|preventDefault
         on:drop|preventDefault={e => {fileInputElement.files = e.dataTransfer.files}} accept="image/*"
         bind:this={fileInputElement} on:change={updateButton} disabled={progress !== -1} type="file" name="file"
         class="file-input file-input-primary" />
  <button disabled={uploadDisabled} type="submit" class="btn btn-primary">Upload</button>
  {#if progress > -1}
    <div class=" w-full h-6 bg-base-200 b-base-100 drop-shadow-lg rounded">
      <div class="transition-all duration-400 ease-in-out h-full bg-primary rounded" style="width: {progress}%"></div>
    </div>
  {/if}
</form>