
<script>
  export let data;
</script>

<svelte:head>
  <title>City Weather Statistics</title>
  <meta name="description" content="Weather statistics by city" />
</svelte:head>

<main class="container">
  <h1>City Weather Statistics</h1>
  
  <table>
    <thead>
      <tr>
        <th>City</th>
        <th>Station Count</th>
        <th>Average Temperature</th>
      </tr>
    </thead>
    <tbody>
      {#each data.data as city}
        <tr>
          <td>{city.city}</td>
          <td>{city.station_count}</td>
          <td>{city.avg_temperature}°C</td>
        </tr>
      {/each}
    </tbody>
  </table>
</main>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }

  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }

  th {
    background-color: #f5f5f5;
    font-weight: bold;
  }

  tr:hover {
    background-color: #f9f9f9;
  }
</style>
