<script>
  import { fly } from "svelte/transition";

  import { onMount } from "svelte";

  let showInstallPromotion = false;
  let deferredPrompt;

  onMount(() => {
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt = e;
      showInstallPromotion = true;
    });

    window.addEventListener("appinstalled", (e) => {
      // save the fact that the app has been installed
    });
  });

  async function installApp() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (outcome === "accepted") {
        console.log("😀 User accepted the install prompt.", true);
      } else if (outcome === "dismissed") {
        console.log("😟 User dismissed the install prompt");
      }
      showInstallPromotion = false;
    }
  }
</script>

{#if showInstallPromotion}
  <button
    in:fly={{ delay: 700, y: 20 }}
    on:click={() => {
      installApp();
    }}
    id="install"
    class="btn mx-3 transition"
  >
    INSTALL PWA
  </button>
{/if}
