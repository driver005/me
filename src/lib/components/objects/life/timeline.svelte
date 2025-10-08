<script lang="ts">
	import type { CONTENT_TIME } from "$lib/types/life";

  let {
    time
  }: {
    time: CONTENT_TIME[]
  } = $props()

  const START_YEAR = 2005;
  const END_YEAR = new Date().getFullYear();

  const getPosition = (year: number) => {
    const range = END_YEAR - START_YEAR
    if (range <= 0) return 0
    const clamped = Math.min(Math.max(year, START_YEAR), END_YEAR)
    return Math.round(((clamped - START_YEAR) / range) * 100)
  }

  const time_int = time.map((val) => ({
      from: parseInt(val.from.includes(".") ? val.from.split(".")[1] : val.from),
      until: val.until ? parseInt(val.until.includes(".") ? val.until.split(".")[1] : val.until) : null
    })
  )

  const end_year_to_exclude = [
    END_YEAR,
    END_YEAR-1,
    END_YEAR-2,
  ]

  const contains_start_year = time_int.some(val => val.from === START_YEAR)
  const contains_end_year = time_int.some(val =>
    end_year_to_exclude.some((year) => year == val.from) ||
    end_year_to_exclude.some((year) => year == val.until)
  )

</script>

<div class="relative w-full pb-8 px-8">
  <div class="relative h-2 bg-gray-200 rounded-full mx-auto max-w-4xl">
    {#if !contains_start_year}
      <div class={"absolute top-1/2 -translate-y-1/2"}>
        <div class="w-3 h-3 rounded-full bg-gray-300"></div>
        <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-bold text-primary whitespace-nowrap">
          {START_YEAR}
        </div>
      </div>
    {/if}
    {#each time as marker, index}
    {#if marker.until}
        <div 
          class="absolute h-full bg-blue-400 rounded-full" 
          style={`left: ${getPosition(time_int[index].from)}%; width: ${getPosition(time_int[index].until!) - getPosition(time_int[index].from)}%;`}
        ></div>
        <div class={"absolute top-1/2 -translate-y-1/2"} style={`left: ${getPosition(time_int[index].until!)}%;`}>
          <div class="w-3 h-3 rounded-full bg-blue-400 ring-4 ring-primary/20"></div>
          <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-bold text-primary whitespace-nowrap">
            {marker.until}
          </div>
        </div>
      {/if}
      <div class={"absolute top-1/2 -translate-y-1/2"} style={`left: ${getPosition(time_int[index].from)}%;`}>
        <div class="w-3 h-3 rounded-full bg-blue-400 ring-4 ring-primary/20"></div>
        <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-bold text-primary whitespace-nowrap">
          {marker.from}
        </div>
      </div>
    {/each}
    {#if !contains_end_year}
      <div class={"absolute right-0 top-1/2 -translate-y-1/2"}>
        <div class="w-3 h-3 rounded-full bg-gray-300"></div>
        <div class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-bold text-primary whitespace-nowrap">
          {END_YEAR}
        </div>
      </div>
    {/if}
  </div>
</div>
