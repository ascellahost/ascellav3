<script lang="ts">
  import { emptyConfig, getConfig, getHeadersFromConfig } from "../utils";

  async function handleFormSubmit(event: SubmitEvent) {
    const config = getConfig();
    //@ts-ignore -
    const formdata = new FormData(event.target);
    const res = await fetch(emptyConfig.RequestURL, {
      method: "POST",
      body: formdata,
      headers: getHeadersFromConfig(config),
    });
    if (res.ok) {
      const json = await res.json();
      window.location.href = `/success?d=${json.delete}&c=${json.url}`;
    } else {
      console.error(res);
    }
  }
</script>

<form on:submit|preventDefault={handleFormSubmit} class="mx-auto grid max-w-lg gap-2">
  <input type="file" name="file" class="file-input file-input-primary" />
  <button type="submit" class="btn btn-primary">Upload</button>
</form>
