<script>
	import "./styles.css";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";

	onMount(() => {
		const html = document.querySelector("html");
		html.setAttribute("data-theme", "dark");
	});

	function toggleTheme() {
		const html = document.querySelector("html");
		const currentTheme = html.getAttribute("data-theme");
		const newTheme = currentTheme === "light" ? "dark" : "light";
		html.setAttribute("data-theme", newTheme);
	}
</script>

<header class="navbar bg-base-100 shadow-lg">
	<div class="flex-1">
		<a href="/" class="btn btn-ghost normal-case text-xl">InfoXM</a>
	</div>
	<div class="flex-none gap-2">
		<button class="btn btn-circle" on:click={toggleTheme}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
				/>
			</svg>
		</button>
	</div>
</header>

<div class="app">
	<main>
		<slot />
	</main>
</div>
