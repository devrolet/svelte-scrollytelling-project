<script>
    import Scroller from '@sveltejs/svelte-scroller';
    import CanvasComponent from './CanvasComponent.svelte';

    let top = 0;
	let threshold = 0.65;
	let bottom = 1;
    let stepIndex = 0;
    let scroller;

    function changeStep(newStep) {
        stepIndex = newStep;
        console.log(stepIndex);
    }

</script>

<!-- 
    TODO: Add top, threshold and bottom markers to guide the enter/exit points for each section. Remove before publish or display
    {top}
    {threshold}
    {bottom}
    changeStep(event.detail
 -->

<Scroller
    {top}
    {threshold}
    {bottom}
    bind:this={scroller} 
    on:section={(event) => console.log(event)} 
>
    <div slot="foreground">
        <div class="scroll-container">
            <section>
                <h1>Section 1 Content</h1>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer non leo a lacus feugiat ullamcorper. Aliquam finibus tincidunt velit vel congue. Aliquam ut sodales tortor. Pellentesque ut condimentum diam, sed ultrices justo. Mauris neque risus, aliquam nec arcu at, vulputate sollicitudin est. Aliquam laoreet nisi quis augue bibendum tristique. Nunc ultrices mauris lectus, viverra elementum velit consequat vel. Phasellus eu pharetra nibh. Nullam eget quam facilisis, scelerisque mi commodo, scelerisque tortor. Nulla efficitur imperdiet urna et faucibus.</p>

                <h2>Section Subhead</h2>
                <p>Vestibulum sollicitudin felis sed tortor vulputate laoreet. Cras venenatis condimentum lacus id suscipit. Ut id pretium orci. Vestibulum scelerisque elit sollicitudin bibendum sagittis. Nam non diam cursus, scelerisque orci quis, mattis ligula. Cras ac orci porta, tristique leo sed, pulvinar massa. Vivamus a luctus nunc, eget scelerisque dui. Fusce sit amet nibh pharetra erat pretium ullamcorper quis vitae ipsum. Phasellus accumsan id erat ac tempor. Nulla et dolor fringilla ipsum molestie varius ut eget lacus. Integer varius tortor non dui malesuada, vitae condimentum sapien pretium. Nunc bibendum dolor nisl, id blandit metus finibus ac. Pellentesque suscipit, velit ac vestibulum hendrerit, lectus turpis consequat velit, sed dignissim justo ligula eu elit. Pellentesque quis tellus eu magna laoreet hendrerit vel sit amet orci. Nulla sit amet laoreet orci, et gravida dui. Cras lacinia tellus ac dignissim pharetra.</p>

                <p>Fusce id nisi at nibh porta auctor. Phasellus at posuere neque, vitae vulputate nibh. Donec pulvinar quam id facilisis suscipit. Ut egestas sit amet nibh sit amet dignissim. Morbi vel neque tellus. Phasellus ultricies nibh eget nibh faucibus, ut tincidunt tortor vulputate. Etiam tempus urna dolor, id volutpat nulla faucibus in. Donec rutrum euismod turpis, vitae sagittis neque interdum ac. Fusce porta metus sed ornare tincidunt. Fusce accumsan sit amet nunc nec volutpat. Nam tempor sollicitudin tincidunt. Sed aliquam metus odio, eget euismod velit varius at. Ut ac ante nec libero luctus accumsan id ac nulla. In hac habitasse platea dictumst. Pellentesque bibendum sollicitudin consectetur. Pellentesque nibh lectus, ullamcorper non urna eget, rhoncus dictum ante.</p>

                <h3>Section Subhead</h3>
                <p>Proin id finibus lectus. Fusce bibendum, elit nec faucibus elementum, sem dui varius turpis, nec mattis lacus dui et libero. Vestibulum posuere sem ut magna interdum bibendum. Duis vitae porttitor diam. Sed metus dolor, mollis vitae nisl quis, ultrices ullamcorper metus. Curabitur diam erat, fermentum vel porta vitae, efficitur vel arcu. Maecenas nec congue tellus. Integer fermentum pharetra felis vel vulputate. Nulla fringilla magna dolor. Nullam vehicula dui fringilla faucibus tristique. Pellentesque at quam gravida purus rhoncus imperdiet quis ac dolor. In viverra, magna vitae tristique efficitur, purus ex fermentum felis, in scelerisque ipsum felis ut lacus. Nunc mollis feugiat ipsum, id bibendum mi auctor ultricies. Nunc volutpat purus et ullamcorper rhoncus. Aliquam nec tellus et odio interdum euismod ut nec diam.</p>

                <p>Nullam ultricies lacus sem, eu venenatis magna aliquam a. Donec vel justo tortor. Aenean venenatis at metus et auctor. Nam nulla sem, viverra quis fringilla in, luctus non arcu. Morbi gravida enim odio, a porttitor arcu sollicitudin a. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In vitae ullamcorper magna. Duis vel risus vel augue placerat rutrum. Cras nec vulputate elit. Ut dignissim condimentum placerat. Aenean felis dui, porttitor id rhoncus ac, interdum non ante.</p>
            </section>

            <section>
                <h1>Section 2 Content</h1>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer non leo a lacus feugiat ullamcorper. Aliquam finibus tincidunt velit vel congue. Aliquam ut sodales tortor. Pellentesque ut condimentum diam, sed ultrices justo. Mauris neque risus, aliquam nec arcu at, vulputate sollicitudin est. Aliquam laoreet nisi quis augue bibendum tristique. Nunc ultrices mauris lectus, viverra elementum velit consequat vel. Phasellus eu pharetra nibh. Nullam eget quam facilisis, scelerisque mi commodo, scelerisque tortor. Nulla efficitur imperdiet urna et faucibus.</p>

                <h2>Section Subhead</h2>
                <p>Vestibulum sollicitudin felis sed tortor vulputate laoreet. Cras venenatis condimentum lacus id suscipit. Ut id pretium orci. Vestibulum scelerisque elit sollicitudin bibendum sagittis. Nam non diam cursus, scelerisque orci quis, mattis ligula. Cras ac orci porta, tristique leo sed, pulvinar massa. Vivamus a luctus nunc, eget scelerisque dui. Fusce sit amet nibh pharetra erat pretium ullamcorper quis vitae ipsum. Phasellus accumsan id erat ac tempor. Nulla et dolor fringilla ipsum molestie varius ut eget lacus. Integer varius tortor non dui malesuada, vitae condimentum sapien pretium. Nunc bibendum dolor nisl, id blandit metus finibus ac. Pellentesque suscipit, velit ac vestibulum hendrerit, lectus turpis consequat velit, sed dignissim justo ligula eu elit. Pellentesque quis tellus eu magna laoreet hendrerit vel sit amet orci. Nulla sit amet laoreet orci, et gravida dui. Cras lacinia tellus ac dignissim pharetra.</p>

                <p>Fusce id nisi at nibh porta auctor. Phasellus at posuere neque, vitae vulputate nibh. Donec pulvinar quam id facilisis suscipit. Ut egestas sit amet nibh sit amet dignissim. Morbi vel neque tellus. Phasellus ultricies nibh eget nibh faucibus, ut tincidunt tortor vulputate. Etiam tempus urna dolor, id volutpat nulla faucibus in. Donec rutrum euismod turpis, vitae sagittis neque interdum ac. Fusce porta metus sed ornare tincidunt. Fusce accumsan sit amet nunc nec volutpat. Nam tempor sollicitudin tincidunt. Sed aliquam metus odio, eget euismod velit varius at. Ut ac ante nec libero luctus accumsan id ac nulla. In hac habitasse platea dictumst. Pellentesque bibendum sollicitudin consectetur. Pellentesque nibh lectus, ullamcorper non urna eget, rhoncus dictum ante.</p>

                <h3>Section Subhead</h3>
                <p>Proin id finibus lectus. Fusce bibendum, elit nec faucibus elementum, sem dui varius turpis, nec mattis lacus dui et libero. Vestibulum posuere sem ut magna interdum bibendum. Duis vitae porttitor diam. Sed metus dolor, mollis vitae nisl quis, ultrices ullamcorper metus. Curabitur diam erat, fermentum vel porta vitae, efficitur vel arcu. Maecenas nec congue tellus. Integer fermentum pharetra felis vel vulputate. Nulla fringilla magna dolor. Nullam vehicula dui fringilla faucibus tristique. Pellentesque at quam gravida purus rhoncus imperdiet quis ac dolor. In viverra, magna vitae tristique efficitur, purus ex fermentum felis, in scelerisque ipsum felis ut lacus. Nunc mollis feugiat ipsum, id bibendum mi auctor ultricies. Nunc volutpat purus et ullamcorper rhoncus. Aliquam nec tellus et odio interdum euismod ut nec diam.</p>

                <p>Nullam ultricies lacus sem, eu venenatis magna aliquam a. Donec vel justo tortor. Aenean venenatis at metus et auctor. Nam nulla sem, viverra quis fringilla in, luctus non arcu. Morbi gravida enim odio, a porttitor arcu sollicitudin a. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In vitae ullamcorper magna. Duis vel risus vel augue placerat rutrum. Cras nec vulputate elit. Ut dignissim condimentum placerat. Aenean felis dui, porttitor id rhoncus ac, interdum non ante.</p>
            </section>

            <section>
                <h1>Section 3 Content</h1>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer non leo a lacus feugiat ullamcorper. Aliquam finibus tincidunt velit vel congue. Aliquam ut sodales tortor. Pellentesque ut condimentum diam, sed ultrices justo. Mauris neque risus, aliquam nec arcu at, vulputate sollicitudin est. Aliquam laoreet nisi quis augue bibendum tristique. Nunc ultrices mauris lectus, viverra elementum velit consequat vel. Phasellus eu pharetra nibh. Nullam eget quam facilisis, scelerisque mi commodo, scelerisque tortor. Nulla efficitur imperdiet urna et faucibus.</p>

                <h2>Section Subhead</h2>
                <p>Vestibulum sollicitudin felis sed tortor vulputate laoreet. Cras venenatis condimentum lacus id suscipit. Ut id pretium orci. Vestibulum scelerisque elit sollicitudin bibendum sagittis. Nam non diam cursus, scelerisque orci quis, mattis ligula. Cras ac orci porta, tristique leo sed, pulvinar massa. Vivamus a luctus nunc, eget scelerisque dui. Fusce sit amet nibh pharetra erat pretium ullamcorper quis vitae ipsum. Phasellus accumsan id erat ac tempor. Nulla et dolor fringilla ipsum molestie varius ut eget lacus. Integer varius tortor non dui malesuada, vitae condimentum sapien pretium. Nunc bibendum dolor nisl, id blandit metus finibus ac. Pellentesque suscipit, velit ac vestibulum hendrerit, lectus turpis consequat velit, sed dignissim justo ligula eu elit. Pellentesque quis tellus eu magna laoreet hendrerit vel sit amet orci. Nulla sit amet laoreet orci, et gravida dui. Cras lacinia tellus ac dignissim pharetra.</p>

                <p>Fusce id nisi at nibh porta auctor. Phasellus at posuere neque, vitae vulputate nibh. Donec pulvinar quam id facilisis suscipit. Ut egestas sit amet nibh sit amet dignissim. Morbi vel neque tellus. Phasellus ultricies nibh eget nibh faucibus, ut tincidunt tortor vulputate. Etiam tempus urna dolor, id volutpat nulla faucibus in. Donec rutrum euismod turpis, vitae sagittis neque interdum ac. Fusce porta metus sed ornare tincidunt. Fusce accumsan sit amet nunc nec volutpat. Nam tempor sollicitudin tincidunt. Sed aliquam metus odio, eget euismod velit varius at. Ut ac ante nec libero luctus accumsan id ac nulla. In hac habitasse platea dictumst. Pellentesque bibendum sollicitudin consectetur. Pellentesque nibh lectus, ullamcorper non urna eget, rhoncus dictum ante.</p>

                <h3>Section Subhead</h3>
                <p>Proin id finibus lectus. Fusce bibendum, elit nec faucibus elementum, sem dui varius turpis, nec mattis lacus dui et libero. Vestibulum posuere sem ut magna interdum bibendum. Duis vitae porttitor diam. Sed metus dolor, mollis vitae nisl quis, ultrices ullamcorper metus. Curabitur diam erat, fermentum vel porta vitae, efficitur vel arcu. Maecenas nec congue tellus. Integer fermentum pharetra felis vel vulputate. Nulla fringilla magna dolor. Nullam vehicula dui fringilla faucibus tristique. Pellentesque at quam gravida purus rhoncus imperdiet quis ac dolor. In viverra, magna vitae tristique efficitur, purus ex fermentum felis, in scelerisque ipsum felis ut lacus. Nunc mollis feugiat ipsum, id bibendum mi auctor ultricies. Nunc volutpat purus et ullamcorper rhoncus. Aliquam nec tellus et odio interdum euismod ut nec diam.</p>

                <p>Nullam ultricies lacus sem, eu venenatis magna aliquam a. Donec vel justo tortor. Aenean venenatis at metus et auctor. Nam nulla sem, viverra quis fringilla in, luctus non arcu. Morbi gravida enim odio, a porttitor arcu sollicitudin a. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In vitae ullamcorper magna. Duis vel risus vel augue placerat rutrum. Cras nec vulputate elit. Ut dignissim condimentum placerat. Aenean felis dui, porttitor id rhoncus ac, interdum non ante.</p>
            </section>

            <section>
                <h1>Section 4 Content</h1>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer non leo a lacus feugiat ullamcorper. Aliquam finibus tincidunt velit vel congue. Aliquam ut sodales tortor. Pellentesque ut condimentum diam, sed ultrices justo. Mauris neque risus, aliquam nec arcu at, vulputate sollicitudin est. Aliquam laoreet nisi quis augue bibendum tristique. Nunc ultrices mauris lectus, viverra elementum velit consequat vel. Phasellus eu pharetra nibh. Nullam eget quam facilisis, scelerisque mi commodo, scelerisque tortor. Nulla efficitur imperdiet urna et faucibus.</p>

                <h2>Section Subhead</h2>
                <p>Vestibulum sollicitudin felis sed tortor vulputate laoreet. Cras venenatis condimentum lacus id suscipit. Ut id pretium orci. Vestibulum scelerisque elit sollicitudin bibendum sagittis. Nam non diam cursus, scelerisque orci quis, mattis ligula. Cras ac orci porta, tristique leo sed, pulvinar massa. Vivamus a luctus nunc, eget scelerisque dui. Fusce sit amet nibh pharetra erat pretium ullamcorper quis vitae ipsum. Phasellus accumsan id erat ac tempor. Nulla et dolor fringilla ipsum molestie varius ut eget lacus. Integer varius tortor non dui malesuada, vitae condimentum sapien pretium. Nunc bibendum dolor nisl, id blandit metus finibus ac. Pellentesque suscipit, velit ac vestibulum hendrerit, lectus turpis consequat velit, sed dignissim justo ligula eu elit. Pellentesque quis tellus eu magna laoreet hendrerit vel sit amet orci. Nulla sit amet laoreet orci, et gravida dui. Cras lacinia tellus ac dignissim pharetra.</p>

                <p>Fusce id nisi at nibh porta auctor. Phasellus at posuere neque, vitae vulputate nibh. Donec pulvinar quam id facilisis suscipit. Ut egestas sit amet nibh sit amet dignissim. Morbi vel neque tellus. Phasellus ultricies nibh eget nibh faucibus, ut tincidunt tortor vulputate. Etiam tempus urna dolor, id volutpat nulla faucibus in. Donec rutrum euismod turpis, vitae sagittis neque interdum ac. Fusce porta metus sed ornare tincidunt. Fusce accumsan sit amet nunc nec volutpat. Nam tempor sollicitudin tincidunt. Sed aliquam metus odio, eget euismod velit varius at. Ut ac ante nec libero luctus accumsan id ac nulla. In hac habitasse platea dictumst. Pellentesque bibendum sollicitudin consectetur. Pellentesque nibh lectus, ullamcorper non urna eget, rhoncus dictum ante.</p>

                <h3>Section Subhead</h3>
                <p>Proin id finibus lectus. Fusce bibendum, elit nec faucibus elementum, sem dui varius turpis, nec mattis lacus dui et libero. Vestibulum posuere sem ut magna interdum bibendum. Duis vitae porttitor diam. Sed metus dolor, mollis vitae nisl quis, ultrices ullamcorper metus. Curabitur diam erat, fermentum vel porta vitae, efficitur vel arcu. Maecenas nec congue tellus. Integer fermentum pharetra felis vel vulputate. Nulla fringilla magna dolor. Nullam vehicula dui fringilla faucibus tristique. Pellentesque at quam gravida purus rhoncus imperdiet quis ac dolor. In viverra, magna vitae tristique efficitur, purus ex fermentum felis, in scelerisque ipsum felis ut lacus. Nunc mollis feugiat ipsum, id bibendum mi auctor ultricies. Nunc volutpat purus et ullamcorper rhoncus. Aliquam nec tellus et odio interdum euismod ut nec diam.</p>

                <p>Nullam ultricies lacus sem, eu venenatis magna aliquam a. Donec vel justo tortor. Aenean venenatis at metus et auctor. Nam nulla sem, viverra quis fringilla in, luctus non arcu. Morbi gravida enim odio, a porttitor arcu sollicitudin a. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In vitae ullamcorper magna. Duis vel risus vel augue placerat rutrum. Cras nec vulputate elit. Ut dignissim condimentum placerat. Aenean felis dui, porttitor id rhoncus ac, interdum non ante.</p>
            </section>
        </div>
    </div>
    <div slot="background">
        <CanvasComponent {stepIndex} />
    </div>
    
</Scroller>



<style>
    .scroll-container {
        width: 100%;
        margin: 0 auto;
        overflow: auto;
    }

    h1 {
        text-align: center;
    }

    section {
        padding: 20px;
        margin: 70vh 10vw;
        min-height: 30vh;
        display: block;
        align-items: center;
        background: rgba(0, 0, 0, 0.5)
    }


</style>