<script lang="ts">
  import { emptyConfig, getConfig, getHeadersFromConfig } from "../utils";
  import { onMount } from "svelte";

  let progress = -1;

  let fileInputElement: HTMLInputElement;

  let files: FileList;

  let uploadDisabled = true;

  let previewUrl = "";

  let sizePreview = "";

  onMount(async () => {
    if ("launchQueue" in window) {
      window.launchQueue.setConsumer(async (launchParams) => {
        if (launchParams.files && launchParams.files.length) {

          const fileArr = []
          for (const file of launchParams.files) {
            const blob = await file.getFile();
            blob.handle = file
            fileArr.push(blob)
          }

          updateButton(fileArr);
        }
      });
    }

    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('receiving-file-share')) {
      const uuid = urlParams.get('uuid')
      const cache = await caches.open('ascella')
      const cacheKey = new Request(`/upload/${uuid}`)
      const file = await cache.match(cacheKey)
      updateButton([await file.blob()])
      await cache.delete(cacheKey)
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

    // send a form data created from the files viariable
    const formData = new FormData();
    formData.append("file", files[0]);
    xhr.send(formData);

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        const json = JSON.parse(xhr.responseText);
        window.location.href = `/success?d=${json.delete}&c=${json.url}`;
      } else {
        console.error(xhr.responseText);
      }

    };

  }


  function updateButton(filesUpdate) {
    uploadDisabled = !filesUpdate || progress !== -1;
    if (filesUpdate.length >= 1) {

      // wait for previewImg to not be null
      previewUrl = URL.createObjectURL(filesUpdate[0]);
      sizePreview = sizefmt(filesUpdate[0].size);
      files = filesUpdate;
    }
  }


  function sizefmt(bytes: number) {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
  }

</script>

<div class="w-full mx-auto min-h-[40rem] max-w-[70rem]">
  <h1 class="text-center text-lg">Upload a Image/File</h1>
  <p class="text-center">Your settings from the config wizard are used!</p>

  <form on:submit|preventDefault={handleFormSubmit} class="mx-auto grid max-w-lg gap-2">

    <input on:dragover|preventDefault on:dragenter|preventDefault
           on:drop|preventDefault={e => {fileInputElement.files = e.dataTransfer.files}} accept="image/*"
           bind:this={fileInputElement} on:change={() => {updateButton(fileInputElement.files)}}
           disabled={progress !== -1} type="file" name="file"
           class="file-input file-input-primary" />
    {#if previewUrl}
      <div class="flex flex-col gap-2">
        <img alt="Preview" class="rounded max-h-[500px] object-contain" src="{previewUrl}" />
        <span class="text-base-content">Size: {sizePreview}</span>
      </div>
    {/if}

    <button disabled={uploadDisabled} type="submit" class="btn btn-primary">Upload</button>
    {#if progress > -1}
      <div class=" w-full h-6 bg-base-200 b-base-100 drop-shadow-lg rounded">
        <div class="transition-all duration-400 ease-in-out h-full bg-primary rounded" style="width: {progress}%"></div>
      </div>
    {/if}
  </form>
</div>
