<script>
  import { Line } from "svelte-chartjs";
  import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    CategoryScale,
    PointElement,
  } from "chart.js";

  ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    CategoryScale,
    PointElement,
  );

  export let data;
  let selectedTimescale = "daily";

  async function handleTimescaleChange(timescale) {
    selectedTimescale = timescale;
    const response = await fetch(
      `/api/weather-cities/${data.city}?timescale=${timescale}`,
    );
    const newData = await response.json();
    data.data = newData;
    console.log("data:");
    console.log(data.data.map((d) => d.temperature));
  }

  $: chartData = {
    labels: data.data.map((d) =>
      new Date(d.observation_timestamp).toLocaleString(),
    ),
    datasets: [
      {
        label: "Temperature (°C)",
        data: data.data.map((d) => d.temperature),
        borderColor: "rgb(255, 99, 132)",
        tension: 0.4,
        cubicInterpolationMode: "monotone",
        borderWidth: 2,
      },
    ],
  };

  $: chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: `Temperature History for ${data.city}`,
      },
    },
  };
</script>

<div class="min-h-screen bg-base-200 p-4">
  <div class="max-w-4xl mx-auto">
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="flex justify-between items-center mb-4">
          <h2 class="card-title text-primary">
            {data.city} Temperature History
          </h2>
          <div class="flex gap-2 flex-wrap justify-center">
            <button
              class="btn btn-sm normal-case {selectedTimescale === 'hourly'
                ? 'btn-primary'
                : 'btn-ghost'} flex items-center gap-1 min-w-[100px]"
              on:click={() => handleTimescaleChange("hourly")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
              </svg>
              Hourly
            </button>
            <button
              class="btn btn-sm normal-case {selectedTimescale === 'daily'
                ? 'btn-primary'
                : 'btn-ghost'} flex items-center gap-1 min-w-[100px]"
              on:click={() => handleTimescaleChange("daily")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
              </svg>
              Daily
            </button>
            <button
              class="btn btn-sm normal-case {selectedTimescale === 'weekly'
                ? 'btn-primary'
                : 'btn-ghost'} flex items-center gap-1 min-w-[100px]"
              on:click={() => handleTimescaleChange("weekly")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
              </svg>
              Weekly
            </button>
            <button
              class="btn btn-sm normal-case {selectedTimescale === 'monthly'
                ? 'btn-primary'
                : 'btn-ghost'} flex items-center gap-1 min-w-[100px]"
              on:click={() => handleTimescaleChange("monthly")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
              </svg>
              Monthly
            </button>
            <button
              class="btn btn-sm normal-case {selectedTimescale === 'yearly'
                ? 'btn-primary'
                : 'btn-ghost'} flex items-center gap-1 min-w-[100px]"
              on:click={() => handleTimescaleChange("yearly")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
              </svg>
              Yearly
            </button>
          </div>
        </div>
        <div class="w-full h-[60vh]">
          <Line data={chartData} options={chartOptions} />
        </div>
        <div class="card-actions justify-end">
          <a href="/" class="btn btn-primary">Back to Cities</a>
        </div>
      </div>
    </div>
  </div>
</div>
