<script>
    import Scroller from '@sveltejs/svelte-scroller';
    import CanvasComponent from './CanvasComponent.svelte';

    let stepIndex = 0;
    let scroller;

    function changeStep(newStep) {
        stepIndex = newStep;
    }
</script>

<Scroller bind:this={scroller} on:section={(event) => changeStep(event.detail)}>
<!-- <Scroller> -->
    <div slot="foreground">
        <div class="scroll-container">
            <section>
                <h1>Section 1 Content</h1>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis sit amet porta lorem. In at aliquet lorem, at ultrices metus. Vestibulum fermentum sit amet magna porttitor tempus. Phasellus risus lorem, volutpat vitae ullamcorper vel, aliquet in tellus. Proin vel neque imperdiet, tristique justo id, tempor turpis. </p>
            </section>
            <section>
                <h1>Section 2 Content</h1>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis sit amet porta lorem. In at aliquet lorem, at ultrices metus. Vestibulum fermentum sit amet magna porttitor tempus. Phasellus risus lorem, volutpat vitae ullamcorper vel, aliquet in tellus. Proin vel neque imperdiet, tristique justo id, tempor turpis. </p>
            </section>
            <section>
                <h1>Section 3 Content</h1>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis sit amet porta lorem. In at aliquet lorem, at ultrices metus. Vestibulum fermentum sit amet magna porttitor tempus. Phasellus risus lorem, volutpat vitae ullamcorper vel, aliquet in tellus. Proin vel neque imperdiet, tristique justo id, tempor turpis. </p>
            </section>
            <section>
                <h1>Section 4 Content</h1>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis sit amet porta lorem. In at aliquet lorem, at ultrices metus. Vestibulum fermentum sit amet magna porttitor tempus. Phasellus risus lorem, volutpat vitae ullamcorper vel, aliquet in tellus. Proin vel neque imperdiet, tristique justo id, tempor turpis. </p>
            </section>
        </div>
    </div>
    <div slot="background">
        <CanvasComponent {stepIndex}></CanvasComponent>
    </div>
    
</Scroller>



<style>
    .scroll-container {
        width: 80%;
        margin: 0 auto;
        overflow: auto;
    }

    section {
        padding: 20px;
        margin: 10vh 10vw;
        min-height: 30vh;
        display: flex;
        justify-content: center;
        align-items: center;
        background: rgba(0, 0, 0, 0.5)
    }


</style>