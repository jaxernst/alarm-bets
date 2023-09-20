<script lang="ts">
	import ToggleLetter from '$lib/components/ToggleLetter.svelte';
	import FormCard from '../FormCard.svelte';
	import { alarmDays } from '../alarmCreation';

	function handleAlarmDayToggle(daySelected: boolean, dayNumber: number) {
		// Toggle day on
		if (daySelected && !$alarmDays.includes(dayNumber)) {
			// Add day to alarmDays if not in already
			return ($alarmDays = [...$alarmDays, dayNumber]);
		}
		// Toggle day off
		if (!daySelected && $alarmDays.includes(dayNumber)) {
			// Remove day from alarmDays if in already
			return ($alarmDays = $alarmDays.filter((d) => d !== dayNumber));
		}
	}
</script>

<FormCard
	itemNumber={3}
	emptyHeader="select days"
	filledHeader="Days"
	inputEmpty={$alarmDays.length === 0}
	inputValid={true}
>
	<div class="flex gap-2">
		{#each ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'] as letter, i}
			<ToggleLetter
				on:toggle={(e) => handleAlarmDayToggle(e.detail, i + 1)}
				value={letter}
				toggled={$alarmDays.includes(i + 1)}
			/>
		{/each}
	</div>
</FormCard>
