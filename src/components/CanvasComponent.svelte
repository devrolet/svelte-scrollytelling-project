<script>
    import { onMount } from "svelte";
    export let stepIndex;

    let canvas; //  = document.getElementById('mapCanvas');
    let ctx; // = canvas.getContext('2d');
    let mapImage;

    function loadMapImage() {
        mapImage = new Image();
        mapImage.src = './img/canvas-map-image.png';
        mapImage.onload = () => {
            ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
        }
    }

    function updateCanvas(step) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        switch(stepIndex) {
            case 1:
                // Example: Zoom in on specific area for step 2 
                ctx.drawImage(mapImage, 300, 800, 300, 200, 0, 0, canvas.width, canvas.height);
                break;
            case 2:
                ctx.drawImage(mapImage, 300, 800, 300, 200, 0, 0, canvas.width, canvas.height);

                // Draw polygon at the zoomed position from case 1
                ctx.beginPath();
                const polygonPoints = [
                    {x: 150, y:250}, 
                    {x: 850, y:100}, 
                    {x: 1100, y:300}, 
                    {x: 510, y:585}, 
                    ];
                ctx.moveTo(polygonPoints[0].x, polygonPoints[0].y);
                for (let i = 0; i < polygonPoints.length; i++) {
                    ctx.lineTo(polygonPoints[i].x, polygonPoints[i].y);
                }
                ctx.closePath();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fill();

                // Add text
                ctx.font = 'bold 60px Arial'; // Set the font style and size
                ctx.fillStyle = "#FFF"; // Set the text color
                ctx.textAlign = 'left'; // Align text horizontally
                ctx.textBaseline = 'middle'; // Align text vertically
                // Calculate the approximate position for the text
                ctx.fillText('Kuhua Camp', 910, 60);
                break;
            case 3:
                // ZOOMED OUT CASE
                ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
                // Draw polygon at the zoomed or navigated position from case 1
                ctx.beginPath();
                const smPolygonPoints = [
                    {x: 450, y:615}, 
                    {x: 620, y:585}, 
                    {x: 670, y:630}, 
                    {x: 550, y:670}, 
                    ];
                ctx.moveTo(smPolygonPoints[0].x, smPolygonPoints[0].y);
                for (let i = 0; i < smPolygonPoints.length; i++) {
                    ctx.lineTo(smPolygonPoints[i].x, smPolygonPoints[i].y);
                }
                ctx.closePath();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.fill();

                // Add text
                ctx.font = 'bold 18px Arial'; // Set the font style and size
                ctx.fillStyle = "#FFF"; // Set the text color
                ctx.textAlign = 'left'; // Align text horizontally
                ctx.textBaseline = 'middle'; // Align text vertically
                // Calculate the approximate position for the text
                ctx.fillText('Kuhua Camp', 640, 590);
                break;
            case 4:
                ctx.drawImage(mapImage, 150, 350, 300, 200, 0, 0, canvas.width, canvas.height);
                // Draw rectangles at the zoomed or navigated position from case 2
                const rectangles = [
                    {x: 520, y: 530, width: 30, height: 10},
                    {x: 520, y: 545, width: 30, height: 10},
                    {x: 520, y: 560, width: 30, height: 10},
                    {x: 520, y: 575, width: 30, height: 10},
                    {x: 520, y: 590, width: 30, height: 10},
                    {x: 475, y: 530, width: 15, height: 12},
                    {x: 430, y: 530, width: 15, height: 12},
                    {x: 475, y: 545, width: 15, height: 12},
                    {x: 430, y: 545, width: 15, height: 12}
                    
                ];
                rectangles.forEach((rect) => {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
                })
                break;
            
            default:
                // Default view
                ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
        }

    }

    onMount(() => {
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
        margin: 20px auto;
        border: 1px solid #ddd;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }
</style>
