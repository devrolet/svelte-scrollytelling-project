<script>
    import { onMount } from "svelte";
    export let stepIndex;

    let canvas;
    let ctx;
    let mapImage;
    

    function loadMapImage() {
        mapImage = new Image();
        mapImage.src = './img/canvas-map-image.png';
        mapImage.onload = () => {
            ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
            console.log(ctx);
        }
    }

    function updateCanvas(stepIndex) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        switch(stepIndex) {
            case 1:
                console.log('This is step 1.');
                break;
            case 2:
                console.log('This is step 2.');
                break;
            case 3:
                console.log('This is step 3.');
                break;
            case 4:
                console.log('This is step 4.');
                break;
            
            default:
                // Default view
                console.log('This is the default step.');
        }

    }

    onMount(() => {
        canvas = document.getElementById('mapCanvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx = canvas.getContext("2d");
        loadMapImage();
    });

    $: if(ctx && mapImage) {
        updateCanvas(stepIndex);
    }
</script>

<canvas id="mapCanvas" bind:this={canvas}></canvas>

<style>
    canvas {
        display: block;
        margin: auto;
        border: 1px solid #ddd;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        width: 100vw;
        height: 100vh;
    }
</style>
