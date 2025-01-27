
<script>
	import "./styles.css";
  import { goto } from '$app/navigation';
</script>

<header class="navbar bg-base-100 shadow-lg">
  <div class="flex-1">
    <a href="/" class="btn btn-ghost normal-case text-xl">InfoXM</a>
  </div>
  <div class="flex-none">
    <a href="/" class="btn btn-ghost">Home</a>
  </div>
</header>

<div class="app">
	<main>
		<slot />
	</main>
</div>

<style>
</style>
