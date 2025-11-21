<script lang="ts">
  let state = $state(false);
</script>

<button onclick={() => (state = !state)}>{state}</button>
