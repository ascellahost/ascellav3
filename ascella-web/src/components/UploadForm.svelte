<script lang="ts">
  import { emptyConfig, getConfig, getHeadersFromConfig } from "../utils";
  import { onMount } from "svelte";
  import Success from "./Success.svelte";

  import {fade, fly} from 'svelte/transition';

  let progress = -1;

  let fileInputElement: HTMLInputElement;

  let files: FileList;

  let uploadDisabled = true;

  let previewUrl = "";

  let sizePreview = "";

  onMount(async () => {

    const urlParams = new URLSearchParams(window.location.search);
    // we we got from the share menu or the file handler hide the file input
    if (urlParams.has("file-handler") || urlParams.has("receiving-file-share")) {
      gotExternally = true;
    }

    if ("launchQueue" in window) {
      window.launchQueue.setConsumer(async (launchParams) => {
        if (launchParams.files && launchParams.files.length) {

          const fileArr = [];
          for (const file of launchParams.files) {
            const blob = await file.getFile();
            blob.handle = file;
            fileArr.push(blob);
          }

          updateButton(fileArr);
        }
      });
    }

    if (urlParams.has("receiving-file-share")) {
      const uuid = urlParams.get("uuid");
      const cache = await caches.open("ascella");
      const cacheKey = new Request(`/upload/${uuid}`);
      const file = await cache.match(cacheKey);
      updateButton([await file.blob()]);
      await cache.delete(cacheKey);
    }

    window.onbeforeunload = s => (files && progress >= 99) ? "" : null;
  });

  async function handleFormSubmit(event: SubmitEvent) {

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", e => {
      console.log(e);
      if (e.lengthComputable) {
        progress = (e.loaded / e.total) * 100;
      }
    });

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        const json = JSON.parse(xhr.responseText);
        deleteUrl = json.delete;
        imgURL = json.url;
        vanity = json.vanity;
        state = 1;
      }
    };

    xhr.open("POST", emptyConfig.RequestURL, true);

    const headers = getHeadersFromConfig(getConfig());
    for (const [key, value] of Object.entries(headers)) {
      xhr.setRequestHeader(encodeURI(key), encodeURI(value));
    }
    const formData = new FormData();
    formData.append("file", files[0]);
    console.log("sending xhr");
    progress = 10;
    xhr.send(formData);
  }

  let gotExternally = false;

  function updateButton(filesUpdate) {

    uploadDisabled = !filesUpdate || progress !== -1;
    if (filesUpdate.length >= 1) {
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


  let state = 0;

  let deleteUrl = "";
  let imgURL = "";
  let vanity = "";

</script>


<div class="multipageContainer">

  {#if state === 0}

      <div class="w-full mx-auto min-h-[40rem] max-w-[70rem]" in:fly="{{ x: 10, duration: 200 }}">
        <h1 class="text-center text-lg">Upload a Image/File</h1>
        <p class="text-center">Your settings from the config wizard are used!</p>

        <form on:submit|preventDefault={handleFormSubmit} class="mx-auto grid max-w-lg gap-2">

          {#if !gotExternally}
            <input on:dragover|preventDefault on:dragenter|preventDefault
                   on:drop|preventDefault={e => {fileInputElement.files = e.dataTransfer.files}} accept="image/*"
                   bind:this={fileInputElement} on:change={() => {updateButton(fileInputElement.files)}}
                   disabled={progress !== -1} type="file" name="file"
                   class="file-input file-input-primary" />
          {/if}
          {#if previewUrl}
            <div class="flex flex-col gap-2">
              <img alt="Preview" class="rounded max-h-[500px] object-contain" src="{previewUrl}" />
              <span class="text-base-content">Size: {sizePreview}</span>
            </div>
          {/if}

          <button disabled={uploadDisabled} type="submit" class="btn btn-primary">Upload</button>
          {#if progress >= 0}
            <div class=" w-full h-6 bg-base-200 b-base-100 drop-shadow-lg rounded">
              <div class="transition-all duration-400 ease-in-out h-full bg-primary rounded"
                   style="width: {progress}%"></div>
            </div>
          {/if}
        </form>
      </div>

  {:else if state === 1}
      <div in:fly="{{ x: 10, duration: 200 }}">
        <h1
          class="text-center text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-accent to-primary p-2">
          Upload success
        </h1>
        <Success del={deleteUrl} vanity={vanity} urls={imgURL} blobPreviewUrl={previewUrl} />
      </div>
  {/if}
</div>

