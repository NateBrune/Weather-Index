<script>
	import "../app.css";
	import { temperatureUnit } from "$lib/stores";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { writable } from "svelte/store";

	export const networkStats = writable({
		station_count: 0,
		median_temperature: 0,
		sparkline_data: [],
	});

	// async function fetchNetworkStats() {
	// 	const response = await fetch("/api/weather-cities/stats");
	// 	const stats = await response.json();
	// 	networkStats.set(stats);
	// }

	onMount(() => {
		const html = document.querySelector("html");
		const savedTheme =
			typeof localStorage !== "undefined"
				? localStorage.getItem("theme")
				: null;
		html.setAttribute("data-theme", savedTheme || "dark");
		//fetchNetworkStats();
	});

	function toggleTheme() {
		const html = document.querySelector("html");
		const currentTheme = html.getAttribute("data-theme");
		const newTheme = currentTheme === "light" ? "dark" : "light";
		html.setAttribute("data-theme", newTheme);
		if (typeof localStorage !== "undefined") {
			localStorage.setItem("theme", newTheme);
		}
	}
</script>

<svelte:head>
	<link
		href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css"
		rel="stylesheet"
		type="text/css"
	/>
	<script src="https://cdn.tailwindcss.com"></script>
</svelte:head>

<header
	class="navbar bg-base-100/90 shadow-lg backdrop-blur-xl fixed top-0 z-50 border-b border-base-300/50"
>
	<div class="flex-1 flex items-center gap-4">
		<a href="/" class="btn btn-ghost normal-case text-xl">Weather Index</a>
		<a href="/stations" class="btn btn-ghost btn-sm">Stations</a>
	</div>
	<div class="flex-none gap-2">
		<a
			href="https://weatherxm.com/ref/adeconde/"
			target="_blank"
			class="btn btn-primary btn-sm">Buy a Station</a
		>
		<button
			class="btn btn-sm mr-2"
			on:click={() => {
				$temperatureUnit = $temperatureUnit === "C" ? "F" : "C";
			}}>°{$temperatureUnit}</button
		>
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
<footer>
	<p>
		Created by <a href="https://x.com/capitalisnn" class="text-info"
			>@capitalisnn</a
		>
		and <a href="https://x.com/0x_atd" class="text-info">@0x_atd</a>
	</p>
	<a href="https://github.com/NateBrune/Weather-Index" class="text-info"
		>Contribute to this project on Github</a
	>
</footer>
