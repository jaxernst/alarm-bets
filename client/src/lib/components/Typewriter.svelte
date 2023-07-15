<script>
  import { onMount, tick } from "svelte";

  export let text = "";
  export let speed = 100;
  export let onComplete = () => {};

  let visibleText = "";

  onMount(async () => {
    for (let i = 0; i < text.length; i++) {
      visibleText += text[i];
      await tick();
      await new Promise((r) => setTimeout(r, speed));
    }
    onComplete();
  });
</script>

<span>{visibleText}</span>
