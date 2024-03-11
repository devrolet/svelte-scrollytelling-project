<script>
    import Scroller from '@sveltejs/svelte-scroller';
    import CanvasComponent from './CanvasComponent.svelte';

    let currentSelecton = 0;

    function updateCanvas(section) {
        currentSelecton = section;
    }
</script>
<!-- <Scroller bind:this={scroller} on:section={(event) => updateCanvas(event.detail)}> -->
<Scroller>
    <div class="section">Section 1 Content</div>
    <div class="section">Section 2 Content</div>
    <div class="section">Section 3 Content</div>
</Scroller>

<CanvasComponent {currentSelecton} />

<style>
    .section {
		height: 100vh;
	}
</style>