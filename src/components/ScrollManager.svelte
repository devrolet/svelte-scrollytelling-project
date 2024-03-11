<script>
    import Scroller from '@sveltejs/svelte-scroller';
    import CanvasComponent from './CanvasComponent.svelte';

    let stepIndex = 0;

    function changeStep(newStep) {
        stepIndex = newStep;
    }
</script>
<!-- <Scroller bind:this={scroller} on:section={(event) => updateCanvas(event.detail)}> -->
<Scroller>
    <div class="section">Section 1 Content</div>
    <div class="section">Section 2 Content</div>
    <div class="section">Section 3 Content</div>
    <div class="section">Section 4 Content</div>
</Scroller>

<CanvasComponent {stepIndex} />

<style>
    

    .section {
        position: relative;
        padding: 20vh 10vw;
        margin: 40vh 0;
        border-radius: 5px;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10; /* ensure text always above the map */
    }
</style>