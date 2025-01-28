<script>
	import "../app.css";
	import { temperatureUnit } from "$lib/stores";
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { writable } from 'svelte/store';

	export const networkStats = writable({ station_count: 0, median_temperature: 0, sparkline_data: [] });

	async function fetchNetworkStats() {
		const response = await fetch('/api/weather-cities/stats');
		const stats = await response.json();
		networkStats.set(stats);
	}

	onMount(() => {
		const html = document.querySelector("html");
		const savedTheme =
			typeof localStorage !== "undefined"
				? localStorage.getItem("theme")
				: null;
		html.setAttribute("data-theme", savedTheme || "dark");
		fetchNetworkStats(); // Call to fetch network stats on mount
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
	<title>WeatherXM Index</title>
	<meta name="description" content="Weather statistics powered by WeatherXM" />
</svelte:head>

<header
	class="navbar bg-base-100/90 shadow-lg backdrop-blur-xl fixed top-0 z-50 border-b border-base-300/50"
>
	<div class="flex-1">
		<a href="/" class="btn btn-ghost normal-case text-xl">Weather Index</a>
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
		{#each data.cities as city}
			<div class="card w-96 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">{city.name}</h2>
					<p>Temperature: {city.temperature}°C</p>
				</div>
			</div>
		{/each}

		<div>
			<h2>Network Median Temperature</h2>
			<p class="text-4xl font-bold">
                {$temperatureUnit === "C" ? 
                  data.networkStats?.median_temperature?.toFixed(1) : 
                  ((data.networkStats?.median_temperature * 9/5) + 32).toFixed(1)}°{$temperatureUnit}
              </p>
		</div>
	</main>
</div>