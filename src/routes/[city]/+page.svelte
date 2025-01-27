<script>
  import { onMount } from "svelte";
  import {
    Chart,
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    LineController,
    TimeScale,
    Title,
    Tooltip,
    Legend,
  } from "chart.js";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores"; // Import $page store to access URL parameters
  import { enUS } from 'date-fns/locale';

  // Register the necessary components, including the LineController and TimeScale
  Chart.register(
    CategoryScale,
    LinearScale,
    LineElement,
    PointElement,
    LineController,
    TimeScale,
    Title,
    Tooltip,
    Legend,
  );

  // Data passed from the load function
  export let data;
  // Get the city from the URL
  let city = $page.params.city;
  // Get the timescale from the URL, defaulting to 'hourly'
  let timescale = $page.params.timescale || 'hourly';
  // Now you can use the 'city' value in your logic
  console.log("City from URL:", city);
  let chartContainer;

  // Log the data to see its structure
  console.log("Weather data:", data);

  // Ensure data is an array before using map
  let timestamps = [];
  let temperatures = [];

  if (Array.isArray(data.data)) {
    timestamps = data.data.map((item) => new Date(item.observation_timestamp));
    temperatures = data.data.map((item) => item.temperature);
  } else {
    console.error("Data is not an array:", data);
  }

  const changeTimescale = (timescale) => {
    // Navigate to the same page with the new timescale in the URL
    // Ensure that the city is passed correctly in the URL
    window.location.href = `/${city}?timescale=${timescale}`;
  };

  // Function to toggle between light and dark themes
  function toggleTheme() {
    const html = document.querySelector("html");
    const currentTheme = html.getAttribute("data-theme");
    const newTheme = currentTheme === "light" ? "dark" : "light";
    html.setAttribute("data-theme", newTheme);
  }

  onMount(() => {
    if (chartContainer) {
      new Chart(chartContainer, {
        type: "line",
        data: {
          datasets: [
            {
              label: "Temperature (°C)",
              data: timestamps.map((timestamp, index) => ({
                x: timestamp,
                y: temperatures[index]
              })),
              borderColor: "rgb(255, 99, 132)",
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              fill: true,
              tension: 0.1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: timescale === 'hourly' ? 'hour' : 'day',
                displayFormats: {
                  hour: 'MMM d, HH:mm',
                  day: 'MMM d'
                }
              },
              adapters: {
                date: {
                  locale: enUS
                }
              },
              title: {
                display: true,
                text: "Time",
              },
            },
            y: {
              type: "linear",
              title: {
                display: true,
                text: "Temperature (°C)",
              },
              ticks: {
                beginAtZero: false,
              },
            },
          },
          plugins: {
            legend: {
              display: true,
            },
          },
        },
      });
    } else {
      console.error("Chart container not found.");
    }
  });
</script>

<svelte:head>
  <title>City Weather Statistics</title>
  <meta name="description" content="Weather statistics by city" />
  <link
    href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css"
    rel="stylesheet"
    type: "text/css"
  />
  <script src="https://cdn.tailwindcss.com"></script>
</svelte:head>

<main class="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
  <!-- Header with Title and Theme Toggle -->
  <header class="flex justify-between items-center mb-6">
    <h1 class="text-3xl font-semibold text-center text-gray-800">
      Weather Data for {city}
    </h1>
    <button class="btn btn-outline" on:click={toggleTheme}>
      Toggle Theme
    </button>
  </header>

  <!-- Timescale Buttons -->
  <div class="mb-6 flex justify-center gap-4">
    <button class="btn btn-primary" on:click={() => changeTimescale("hourly")}>
      Hourly
    </button>
    <button class="btn btn-primary" on:click={() => changeTimescale("daily")}>
      Daily
    </button>
    <button class="btn btn-primary" on:click={() => changeTimescale("weekly")}>
      Weekly
    </button>
    <button class="btn btn-primary" on:click={() => changeTimescale("monthly")}>
      Monthly
    </button>
    <button class="btn btn-primary" on:click={() => changeTimescale("yearly")}>
      Yearly
    </button>
  </div>

  <!-- Canvas for the chart -->
  <div class="mb-6">
    <canvas bind:this={chartContainer}></canvas>
  </div>
</main>

<style>
  canvas {
    width: 100%;
    height: 400px;
  }
</style>