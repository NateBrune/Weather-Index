<script>
  import { page } from "$app/stores";

  $: {
    if (typeof gtag !== "undefined") {
      gtag("config", "G-Q5W2P7PCEM", {
        page_title: document.title,
        page_path: $page.url.pathname,
      });
    }
  }
</script>

<svelte:head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-Q5W2P7PCEM">
  </script>
  <script>
    window.dataLayer = window.dataLayer || [];

    function gtag() {
      dataLayer.push(arguments);
    }

    gtag("js", new Date());
    gtag("config", "G-Q5W2P7PCEM");
  </script>
</svelte:head>
