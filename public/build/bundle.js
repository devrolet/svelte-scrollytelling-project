
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_custom_element_data(node, prop, value) {
        if (prop in node) {
            node[prop] = typeof node[prop] === 'boolean' && value === '' ? true : value;
        }
        else {
            attr(node, prop, value);
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* node_modules/@sveltejs/svelte-scroller/Scroller.svelte generated by Svelte v3.59.2 */

    const { window: window_1 } = globals;
    const file$3 = "node_modules/@sveltejs/svelte-scroller/Scroller.svelte";
    const get_foreground_slot_changes = dirty => ({});
    const get_foreground_slot_context = ctx => ({});
    const get_background_slot_changes = dirty => ({});
    const get_background_slot_context = ctx => ({});

    function create_fragment$3(ctx) {
    	let svelte_scroller_outer;
    	let svelte_scroller_background_container;
    	let svelte_scroller_background;
    	let svelte_scroller_background_container_style_value;
    	let t;
    	let svelte_scroller_foreground;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowresize*/ ctx[21]);
    	const background_slot_template = /*#slots*/ ctx[20].background;
    	const background_slot = create_slot(background_slot_template, ctx, /*$$scope*/ ctx[19], get_background_slot_context);
    	const foreground_slot_template = /*#slots*/ ctx[20].foreground;
    	const foreground_slot = create_slot(foreground_slot_template, ctx, /*$$scope*/ ctx[19], get_foreground_slot_context);

    	const block = {
    		c: function create() {
    			svelte_scroller_outer = element("svelte-scroller-outer");
    			svelte_scroller_background_container = element("svelte-scroller-background-container");
    			svelte_scroller_background = element("svelte-scroller-background");
    			if (background_slot) background_slot.c();
    			t = space();
    			svelte_scroller_foreground = element("svelte-scroller-foreground");
    			if (foreground_slot) foreground_slot.c();
    			set_custom_element_data(svelte_scroller_background, "class", "svelte-xdbafy");
    			add_location(svelte_scroller_background, file$3, 173, 2, 3978);
    			set_custom_element_data(svelte_scroller_background_container, "class", "background-container svelte-xdbafy");
    			set_custom_element_data(svelte_scroller_background_container, "style", svelte_scroller_background_container_style_value = "" + (/*style*/ ctx[5] + /*widthStyle*/ ctx[4]));
    			add_location(svelte_scroller_background_container, file$3, 172, 1, 3880);
    			set_custom_element_data(svelte_scroller_foreground, "class", "svelte-xdbafy");
    			add_location(svelte_scroller_foreground, file$3, 178, 1, 4140);
    			set_custom_element_data(svelte_scroller_outer, "class", "svelte-xdbafy");
    			add_location(svelte_scroller_outer, file$3, 171, 0, 3837);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svelte_scroller_outer, anchor);
    			append_dev(svelte_scroller_outer, svelte_scroller_background_container);
    			append_dev(svelte_scroller_background_container, svelte_scroller_background);

    			if (background_slot) {
    				background_slot.m(svelte_scroller_background, null);
    			}

    			/*svelte_scroller_background_binding*/ ctx[22](svelte_scroller_background);
    			append_dev(svelte_scroller_outer, t);
    			append_dev(svelte_scroller_outer, svelte_scroller_foreground);

    			if (foreground_slot) {
    				foreground_slot.m(svelte_scroller_foreground, null);
    			}

    			/*svelte_scroller_foreground_binding*/ ctx[23](svelte_scroller_foreground);
    			/*svelte_scroller_outer_binding*/ ctx[24](svelte_scroller_outer);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window_1, "resize", /*onwindowresize*/ ctx[21]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (background_slot) {
    				if (background_slot.p && (!current || dirty[0] & /*$$scope*/ 524288)) {
    					update_slot_base(
    						background_slot,
    						background_slot_template,
    						ctx,
    						/*$$scope*/ ctx[19],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[19])
    						: get_slot_changes(background_slot_template, /*$$scope*/ ctx[19], dirty, get_background_slot_changes),
    						get_background_slot_context
    					);
    				}
    			}

    			if (!current || dirty[0] & /*style, widthStyle*/ 48 && svelte_scroller_background_container_style_value !== (svelte_scroller_background_container_style_value = "" + (/*style*/ ctx[5] + /*widthStyle*/ ctx[4]))) {
    				set_custom_element_data(svelte_scroller_background_container, "style", svelte_scroller_background_container_style_value);
    			}

    			if (foreground_slot) {
    				if (foreground_slot.p && (!current || dirty[0] & /*$$scope*/ 524288)) {
    					update_slot_base(
    						foreground_slot,
    						foreground_slot_template,
    						ctx,
    						/*$$scope*/ ctx[19],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[19])
    						: get_slot_changes(foreground_slot_template, /*$$scope*/ ctx[19], dirty, get_foreground_slot_changes),
    						get_foreground_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(background_slot, local);
    			transition_in(foreground_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(background_slot, local);
    			transition_out(foreground_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svelte_scroller_outer);
    			if (background_slot) background_slot.d(detaching);
    			/*svelte_scroller_background_binding*/ ctx[22](null);
    			if (foreground_slot) foreground_slot.d(detaching);
    			/*svelte_scroller_foreground_binding*/ ctx[23](null);
    			/*svelte_scroller_outer_binding*/ ctx[24](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const handlers = [];
    let manager;

    if (typeof window !== 'undefined') {
    	const run_all = () => handlers.forEach(fn => fn());
    	window.addEventListener('scroll', run_all);
    	window.addEventListener('resize', run_all);
    }

    if (typeof IntersectionObserver !== 'undefined') {
    	const map = new Map();

    	const observer = new IntersectionObserver((entries, observer) => {
    			entries.forEach(entry => {
    				const update = map.get(entry.target);
    				const index = handlers.indexOf(update);

    				if (entry.isIntersecting) {
    					if (index === -1) handlers.push(update);
    				} else {
    					update();
    					if (index !== -1) handlers.splice(index, 1);
    				}
    			});
    		},
    	{
    			rootMargin: '400px 0px', // TODO why 400?
    			
    		});

    	manager = {
    		add: ({ outer, update }) => {
    			const { top, bottom } = outer.getBoundingClientRect();
    			if (top < window.innerHeight && bottom > 0) handlers.push(update);
    			map.set(outer, update);
    			observer.observe(outer);
    		},
    		remove: ({ outer, update }) => {
    			const index = handlers.indexOf(update);
    			if (index !== -1) handlers.splice(index, 1);
    			map.delete(outer);
    			observer.unobserve(outer);
    		}
    	};
    } else {
    	manager = {
    		add: ({ update }) => {
    			handlers.push(update);
    		},
    		remove: ({ update }) => {
    			const index = handlers.indexOf(update);
    			if (index !== -1) handlers.splice(index, 1);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let top_px;
    	let bottom_px;
    	let threshold_px;
    	let style;
    	let widthStyle;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Scroller', slots, ['background','foreground']);
    	let { top = 0 } = $$props;
    	let { bottom = 1 } = $$props;
    	let { threshold = 0.5 } = $$props;
    	let { query = 'section' } = $$props;
    	let { parallax = false } = $$props;
    	let { index = 0 } = $$props;
    	let { count = 0 } = $$props;
    	let { offset = 0 } = $$props;
    	let { progress = 0 } = $$props;
    	let { visible = false } = $$props;
    	let outer;
    	let foreground;
    	let background;
    	let left;
    	let sections;
    	let wh = 0;
    	let fixed;
    	let offset_top = 0;
    	let width = 1;
    	let height;
    	let inverted;

    	onMount(() => {
    		sections = foreground.querySelectorAll(query);
    		$$invalidate(7, count = sections.length);
    		update();
    		const scroller = { outer, update };
    		manager.add(scroller);
    		return () => manager.remove(scroller);
    	});

    	function update() {
    		if (!foreground) return;

    		// re-measure outer container
    		const bcr = outer.getBoundingClientRect();

    		left = bcr.left;
    		$$invalidate(18, width = bcr.right - left);

    		// determine fix state
    		const fg = foreground.getBoundingClientRect();

    		const bg = background.getBoundingClientRect();
    		$$invalidate(10, visible = fg.top < wh && fg.bottom > 0);
    		const foreground_height = fg.bottom - fg.top;
    		const background_height = bg.bottom - bg.top;
    		const available_space = bottom_px - top_px;
    		$$invalidate(9, progress = (top_px - fg.top) / (foreground_height - available_space));

    		if (progress <= 0) {
    			$$invalidate(17, offset_top = 0);
    			$$invalidate(16, fixed = false);
    		} else if (progress >= 1) {
    			$$invalidate(17, offset_top = parallax
    			? foreground_height - background_height
    			: foreground_height - available_space);

    			$$invalidate(16, fixed = false);
    		} else {
    			$$invalidate(17, offset_top = parallax
    			? Math.round(top_px - progress * (background_height - available_space))
    			: top_px);

    			$$invalidate(16, fixed = true);
    		}

    		for (let i = 0; i < sections.length; i++) {
    			const section = sections[i];
    			const { top } = section.getBoundingClientRect();
    			const next = sections[i + 1];
    			const bottom = next ? next.getBoundingClientRect().top : fg.bottom;
    			$$invalidate(8, offset = (threshold_px - top) / (bottom - top));

    			if (bottom >= threshold_px) {
    				$$invalidate(6, index = i);
    				break;
    			}
    		}
    	}

    	const writable_props = [
    		'top',
    		'bottom',
    		'threshold',
    		'query',
    		'parallax',
    		'index',
    		'count',
    		'offset',
    		'progress',
    		'visible'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Scroller> was created with unknown prop '${key}'`);
    	});

    	function onwindowresize() {
    		$$invalidate(0, wh = window_1.innerHeight);
    	}

    	function svelte_scroller_background_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			background = $$value;
    			$$invalidate(3, background);
    		});
    	}

    	function svelte_scroller_foreground_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			foreground = $$value;
    			$$invalidate(2, foreground);
    		});
    	}

    	function svelte_scroller_outer_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			outer = $$value;
    			$$invalidate(1, outer);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('top' in $$props) $$invalidate(11, top = $$props.top);
    		if ('bottom' in $$props) $$invalidate(12, bottom = $$props.bottom);
    		if ('threshold' in $$props) $$invalidate(13, threshold = $$props.threshold);
    		if ('query' in $$props) $$invalidate(14, query = $$props.query);
    		if ('parallax' in $$props) $$invalidate(15, parallax = $$props.parallax);
    		if ('index' in $$props) $$invalidate(6, index = $$props.index);
    		if ('count' in $$props) $$invalidate(7, count = $$props.count);
    		if ('offset' in $$props) $$invalidate(8, offset = $$props.offset);
    		if ('progress' in $$props) $$invalidate(9, progress = $$props.progress);
    		if ('visible' in $$props) $$invalidate(10, visible = $$props.visible);
    		if ('$$scope' in $$props) $$invalidate(19, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		handlers,
    		manager,
    		onMount,
    		top,
    		bottom,
    		threshold,
    		query,
    		parallax,
    		index,
    		count,
    		offset,
    		progress,
    		visible,
    		outer,
    		foreground,
    		background,
    		left,
    		sections,
    		wh,
    		fixed,
    		offset_top,
    		width,
    		height,
    		inverted,
    		update,
    		threshold_px,
    		top_px,
    		bottom_px,
    		widthStyle,
    		style
    	});

    	$$self.$inject_state = $$props => {
    		if ('top' in $$props) $$invalidate(11, top = $$props.top);
    		if ('bottom' in $$props) $$invalidate(12, bottom = $$props.bottom);
    		if ('threshold' in $$props) $$invalidate(13, threshold = $$props.threshold);
    		if ('query' in $$props) $$invalidate(14, query = $$props.query);
    		if ('parallax' in $$props) $$invalidate(15, parallax = $$props.parallax);
    		if ('index' in $$props) $$invalidate(6, index = $$props.index);
    		if ('count' in $$props) $$invalidate(7, count = $$props.count);
    		if ('offset' in $$props) $$invalidate(8, offset = $$props.offset);
    		if ('progress' in $$props) $$invalidate(9, progress = $$props.progress);
    		if ('visible' in $$props) $$invalidate(10, visible = $$props.visible);
    		if ('outer' in $$props) $$invalidate(1, outer = $$props.outer);
    		if ('foreground' in $$props) $$invalidate(2, foreground = $$props.foreground);
    		if ('background' in $$props) $$invalidate(3, background = $$props.background);
    		if ('left' in $$props) left = $$props.left;
    		if ('sections' in $$props) sections = $$props.sections;
    		if ('wh' in $$props) $$invalidate(0, wh = $$props.wh);
    		if ('fixed' in $$props) $$invalidate(16, fixed = $$props.fixed);
    		if ('offset_top' in $$props) $$invalidate(17, offset_top = $$props.offset_top);
    		if ('width' in $$props) $$invalidate(18, width = $$props.width);
    		if ('height' in $$props) height = $$props.height;
    		if ('inverted' in $$props) $$invalidate(31, inverted = $$props.inverted);
    		if ('threshold_px' in $$props) threshold_px = $$props.threshold_px;
    		if ('top_px' in $$props) top_px = $$props.top_px;
    		if ('bottom_px' in $$props) bottom_px = $$props.bottom_px;
    		if ('widthStyle' in $$props) $$invalidate(4, widthStyle = $$props.widthStyle);
    		if ('style' in $$props) $$invalidate(5, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*top, wh*/ 2049) {
    			top_px = Math.round(top * wh);
    		}

    		if ($$self.$$.dirty[0] & /*bottom, wh*/ 4097) {
    			bottom_px = Math.round(bottom * wh);
    		}

    		if ($$self.$$.dirty[0] & /*threshold, wh*/ 8193) {
    			threshold_px = Math.round(threshold * wh);
    		}

    		if ($$self.$$.dirty[0] & /*top, bottom, threshold, parallax*/ 47104) {
    			(update());
    		}

    		if ($$self.$$.dirty[0] & /*fixed, offset_top*/ 196608) {
    			$$invalidate(5, style = `
		position: ${fixed ? 'fixed' : 'absolute'};
		top: 0;
		transform: translate(0, ${offset_top}px);
		z-index: ${inverted ? 3 : 1};
	`);
    		}

    		if ($$self.$$.dirty[0] & /*fixed, width*/ 327680) {
    			$$invalidate(4, widthStyle = fixed ? `width:${width}px;` : '');
    		}
    	};

    	return [
    		wh,
    		outer,
    		foreground,
    		background,
    		widthStyle,
    		style,
    		index,
    		count,
    		offset,
    		progress,
    		visible,
    		top,
    		bottom,
    		threshold,
    		query,
    		parallax,
    		fixed,
    		offset_top,
    		width,
    		$$scope,
    		slots,
    		onwindowresize,
    		svelte_scroller_background_binding,
    		svelte_scroller_foreground_binding,
    		svelte_scroller_outer_binding
    	];
    }

    class Scroller extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{
    				top: 11,
    				bottom: 12,
    				threshold: 13,
    				query: 14,
    				parallax: 15,
    				index: 6,
    				count: 7,
    				offset: 8,
    				progress: 9,
    				visible: 10
    			},
    			null,
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Scroller",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get top() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bottom() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bottom(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get threshold() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set threshold(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get query() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set query(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get parallax() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set parallax(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get count() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set count(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get offset() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set offset(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get progress() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set progress(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visible() {
    		throw new Error("<Scroller>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<Scroller>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/CanvasComponent.svelte generated by Svelte v3.59.2 */

    const { console: console_1$1 } = globals;
    const file$2 = "src/components/CanvasComponent.svelte";

    function create_fragment$2(ctx) {
    	let canvas_1;

    	const block = {
    		c: function create() {
    			canvas_1 = element("canvas");
    			attr_dev(canvas_1, "id", "mapCanvas");
    			attr_dev(canvas_1, "class", "svelte-1pchtlu");
    			add_location(canvas_1, file$2, 55, 0, 1339);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas_1, anchor);
    			/*canvas_1_binding*/ ctx[4](canvas_1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas_1);
    			/*canvas_1_binding*/ ctx[4](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CanvasComponent', slots, []);
    	let { stepIndex } = $$props;
    	let canvas;
    	let ctx;
    	let mapImage;

    	function loadMapImage() {
    		$$invalidate(3, mapImage = new Image());
    		$$invalidate(3, mapImage.src = './img/canvas-map-image.png', mapImage);

    		$$invalidate(
    			3,
    			mapImage.onload = () => {
    				ctx.drawImage(mapImage, 0, 0, canvas.width, canvas.height);
    				console.log(ctx);
    			},
    			mapImage
    		);
    	}

    	function updateCanvas(stepIndex) {
    		ctx.clearRect(0, 0, canvas.width, canvas.height);

    		switch (stepIndex) {
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
    		$$invalidate(0, canvas = document.getElementById('mapCanvas'));
    		$$invalidate(0, canvas.width = window.innerWidth, canvas);
    		$$invalidate(0, canvas.height = window.innerHeight, canvas);
    		$$invalidate(2, ctx = canvas.getContext("2d"));
    		loadMapImage();
    	});

    	$$self.$$.on_mount.push(function () {
    		if (stepIndex === undefined && !('stepIndex' in $$props || $$self.$$.bound[$$self.$$.props['stepIndex']])) {
    			console_1$1.warn("<CanvasComponent> was created without expected prop 'stepIndex'");
    		}
    	});

    	const writable_props = ['stepIndex'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<CanvasComponent> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas = $$value;
    			$$invalidate(0, canvas);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('stepIndex' in $$props) $$invalidate(1, stepIndex = $$props.stepIndex);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		stepIndex,
    		canvas,
    		ctx,
    		mapImage,
    		loadMapImage,
    		updateCanvas
    	});

    	$$self.$inject_state = $$props => {
    		if ('stepIndex' in $$props) $$invalidate(1, stepIndex = $$props.stepIndex);
    		if ('canvas' in $$props) $$invalidate(0, canvas = $$props.canvas);
    		if ('ctx' in $$props) $$invalidate(2, ctx = $$props.ctx);
    		if ('mapImage' in $$props) $$invalidate(3, mapImage = $$props.mapImage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*ctx, mapImage, stepIndex*/ 14) {
    			if (ctx && mapImage) {
    				updateCanvas(stepIndex);
    			}
    		}
    	};

    	return [canvas, stepIndex, ctx, mapImage, canvas_1_binding];
    }

    class CanvasComponent extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { stepIndex: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CanvasComponent",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get stepIndex() {
    		throw new Error("<CanvasComponent>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set stepIndex(value) {
    		throw new Error("<CanvasComponent>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/ScrollManager.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file$1 = "src/components/ScrollManager.svelte";

    // (33:4) 
    function create_foreground_slot(ctx) {
    	let div1;
    	let div0;
    	let section0;
    	let h10;
    	let t1;
    	let p0;
    	let t3;
    	let h20;
    	let t5;
    	let p1;
    	let t7;
    	let p2;
    	let t9;
    	let h30;
    	let t11;
    	let p3;
    	let t13;
    	let p4;
    	let t15;
    	let section1;
    	let h11;
    	let t17;
    	let p5;
    	let t19;
    	let h21;
    	let t21;
    	let p6;
    	let t23;
    	let p7;
    	let t25;
    	let h31;
    	let t27;
    	let p8;
    	let t29;
    	let p9;
    	let t31;
    	let section2;
    	let h12;
    	let t33;
    	let p10;
    	let t35;
    	let h22;
    	let t37;
    	let p11;
    	let t39;
    	let p12;
    	let t41;
    	let h32;
    	let t43;
    	let p13;
    	let t45;
    	let p14;
    	let t47;
    	let section3;
    	let h13;
    	let t49;
    	let p15;
    	let t51;
    	let h23;
    	let t53;
    	let p16;
    	let t55;
    	let p17;
    	let t57;
    	let h33;
    	let t59;
    	let p18;
    	let t61;
    	let p19;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			section0 = element("section");
    			h10 = element("h1");
    			h10.textContent = "Section 1 Content";
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer non leo a lacus feugiat ullamcorper. Aliquam finibus tincidunt velit vel congue. Aliquam ut sodales tortor. Pellentesque ut condimentum diam, sed ultrices justo. Mauris neque risus, aliquam nec arcu at, vulputate sollicitudin est. Aliquam laoreet nisi quis augue bibendum tristique. Nunc ultrices mauris lectus, viverra elementum velit consequat vel. Phasellus eu pharetra nibh. Nullam eget quam facilisis, scelerisque mi commodo, scelerisque tortor. Nulla efficitur imperdiet urna et faucibus.";
    			t3 = space();
    			h20 = element("h2");
    			h20.textContent = "Section Subhead";
    			t5 = space();
    			p1 = element("p");
    			p1.textContent = "Vestibulum sollicitudin felis sed tortor vulputate laoreet. Cras venenatis condimentum lacus id suscipit. Ut id pretium orci. Vestibulum scelerisque elit sollicitudin bibendum sagittis. Nam non diam cursus, scelerisque orci quis, mattis ligula. Cras ac orci porta, tristique leo sed, pulvinar massa. Vivamus a luctus nunc, eget scelerisque dui. Fusce sit amet nibh pharetra erat pretium ullamcorper quis vitae ipsum. Phasellus accumsan id erat ac tempor. Nulla et dolor fringilla ipsum molestie varius ut eget lacus. Integer varius tortor non dui malesuada, vitae condimentum sapien pretium. Nunc bibendum dolor nisl, id blandit metus finibus ac. Pellentesque suscipit, velit ac vestibulum hendrerit, lectus turpis consequat velit, sed dignissim justo ligula eu elit. Pellentesque quis tellus eu magna laoreet hendrerit vel sit amet orci. Nulla sit amet laoreet orci, et gravida dui. Cras lacinia tellus ac dignissim pharetra.";
    			t7 = space();
    			p2 = element("p");
    			p2.textContent = "Fusce id nisi at nibh porta auctor. Phasellus at posuere neque, vitae vulputate nibh. Donec pulvinar quam id facilisis suscipit. Ut egestas sit amet nibh sit amet dignissim. Morbi vel neque tellus. Phasellus ultricies nibh eget nibh faucibus, ut tincidunt tortor vulputate. Etiam tempus urna dolor, id volutpat nulla faucibus in. Donec rutrum euismod turpis, vitae sagittis neque interdum ac. Fusce porta metus sed ornare tincidunt. Fusce accumsan sit amet nunc nec volutpat. Nam tempor sollicitudin tincidunt. Sed aliquam metus odio, eget euismod velit varius at. Ut ac ante nec libero luctus accumsan id ac nulla. In hac habitasse platea dictumst. Pellentesque bibendum sollicitudin consectetur. Pellentesque nibh lectus, ullamcorper non urna eget, rhoncus dictum ante.";
    			t9 = space();
    			h30 = element("h3");
    			h30.textContent = "Section Subhead";
    			t11 = space();
    			p3 = element("p");
    			p3.textContent = "Proin id finibus lectus. Fusce bibendum, elit nec faucibus elementum, sem dui varius turpis, nec mattis lacus dui et libero. Vestibulum posuere sem ut magna interdum bibendum. Duis vitae porttitor diam. Sed metus dolor, mollis vitae nisl quis, ultrices ullamcorper metus. Curabitur diam erat, fermentum vel porta vitae, efficitur vel arcu. Maecenas nec congue tellus. Integer fermentum pharetra felis vel vulputate. Nulla fringilla magna dolor. Nullam vehicula dui fringilla faucibus tristique. Pellentesque at quam gravida purus rhoncus imperdiet quis ac dolor. In viverra, magna vitae tristique efficitur, purus ex fermentum felis, in scelerisque ipsum felis ut lacus. Nunc mollis feugiat ipsum, id bibendum mi auctor ultricies. Nunc volutpat purus et ullamcorper rhoncus. Aliquam nec tellus et odio interdum euismod ut nec diam.";
    			t13 = space();
    			p4 = element("p");
    			p4.textContent = "Nullam ultricies lacus sem, eu venenatis magna aliquam a. Donec vel justo tortor. Aenean venenatis at metus et auctor. Nam nulla sem, viverra quis fringilla in, luctus non arcu. Morbi gravida enim odio, a porttitor arcu sollicitudin a. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In vitae ullamcorper magna. Duis vel risus vel augue placerat rutrum. Cras nec vulputate elit. Ut dignissim condimentum placerat. Aenean felis dui, porttitor id rhoncus ac, interdum non ante.";
    			t15 = space();
    			section1 = element("section");
    			h11 = element("h1");
    			h11.textContent = "Section 2 Content";
    			t17 = space();
    			p5 = element("p");
    			p5.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer non leo a lacus feugiat ullamcorper. Aliquam finibus tincidunt velit vel congue. Aliquam ut sodales tortor. Pellentesque ut condimentum diam, sed ultrices justo. Mauris neque risus, aliquam nec arcu at, vulputate sollicitudin est. Aliquam laoreet nisi quis augue bibendum tristique. Nunc ultrices mauris lectus, viverra elementum velit consequat vel. Phasellus eu pharetra nibh. Nullam eget quam facilisis, scelerisque mi commodo, scelerisque tortor. Nulla efficitur imperdiet urna et faucibus.";
    			t19 = space();
    			h21 = element("h2");
    			h21.textContent = "Section Subhead";
    			t21 = space();
    			p6 = element("p");
    			p6.textContent = "Vestibulum sollicitudin felis sed tortor vulputate laoreet. Cras venenatis condimentum lacus id suscipit. Ut id pretium orci. Vestibulum scelerisque elit sollicitudin bibendum sagittis. Nam non diam cursus, scelerisque orci quis, mattis ligula. Cras ac orci porta, tristique leo sed, pulvinar massa. Vivamus a luctus nunc, eget scelerisque dui. Fusce sit amet nibh pharetra erat pretium ullamcorper quis vitae ipsum. Phasellus accumsan id erat ac tempor. Nulla et dolor fringilla ipsum molestie varius ut eget lacus. Integer varius tortor non dui malesuada, vitae condimentum sapien pretium. Nunc bibendum dolor nisl, id blandit metus finibus ac. Pellentesque suscipit, velit ac vestibulum hendrerit, lectus turpis consequat velit, sed dignissim justo ligula eu elit. Pellentesque quis tellus eu magna laoreet hendrerit vel sit amet orci. Nulla sit amet laoreet orci, et gravida dui. Cras lacinia tellus ac dignissim pharetra.";
    			t23 = space();
    			p7 = element("p");
    			p7.textContent = "Fusce id nisi at nibh porta auctor. Phasellus at posuere neque, vitae vulputate nibh. Donec pulvinar quam id facilisis suscipit. Ut egestas sit amet nibh sit amet dignissim. Morbi vel neque tellus. Phasellus ultricies nibh eget nibh faucibus, ut tincidunt tortor vulputate. Etiam tempus urna dolor, id volutpat nulla faucibus in. Donec rutrum euismod turpis, vitae sagittis neque interdum ac. Fusce porta metus sed ornare tincidunt. Fusce accumsan sit amet nunc nec volutpat. Nam tempor sollicitudin tincidunt. Sed aliquam metus odio, eget euismod velit varius at. Ut ac ante nec libero luctus accumsan id ac nulla. In hac habitasse platea dictumst. Pellentesque bibendum sollicitudin consectetur. Pellentesque nibh lectus, ullamcorper non urna eget, rhoncus dictum ante.";
    			t25 = space();
    			h31 = element("h3");
    			h31.textContent = "Section Subhead";
    			t27 = space();
    			p8 = element("p");
    			p8.textContent = "Proin id finibus lectus. Fusce bibendum, elit nec faucibus elementum, sem dui varius turpis, nec mattis lacus dui et libero. Vestibulum posuere sem ut magna interdum bibendum. Duis vitae porttitor diam. Sed metus dolor, mollis vitae nisl quis, ultrices ullamcorper metus. Curabitur diam erat, fermentum vel porta vitae, efficitur vel arcu. Maecenas nec congue tellus. Integer fermentum pharetra felis vel vulputate. Nulla fringilla magna dolor. Nullam vehicula dui fringilla faucibus tristique. Pellentesque at quam gravida purus rhoncus imperdiet quis ac dolor. In viverra, magna vitae tristique efficitur, purus ex fermentum felis, in scelerisque ipsum felis ut lacus. Nunc mollis feugiat ipsum, id bibendum mi auctor ultricies. Nunc volutpat purus et ullamcorper rhoncus. Aliquam nec tellus et odio interdum euismod ut nec diam.";
    			t29 = space();
    			p9 = element("p");
    			p9.textContent = "Nullam ultricies lacus sem, eu venenatis magna aliquam a. Donec vel justo tortor. Aenean venenatis at metus et auctor. Nam nulla sem, viverra quis fringilla in, luctus non arcu. Morbi gravida enim odio, a porttitor arcu sollicitudin a. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In vitae ullamcorper magna. Duis vel risus vel augue placerat rutrum. Cras nec vulputate elit. Ut dignissim condimentum placerat. Aenean felis dui, porttitor id rhoncus ac, interdum non ante.";
    			t31 = space();
    			section2 = element("section");
    			h12 = element("h1");
    			h12.textContent = "Section 3 Content";
    			t33 = space();
    			p10 = element("p");
    			p10.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer non leo a lacus feugiat ullamcorper. Aliquam finibus tincidunt velit vel congue. Aliquam ut sodales tortor. Pellentesque ut condimentum diam, sed ultrices justo. Mauris neque risus, aliquam nec arcu at, vulputate sollicitudin est. Aliquam laoreet nisi quis augue bibendum tristique. Nunc ultrices mauris lectus, viverra elementum velit consequat vel. Phasellus eu pharetra nibh. Nullam eget quam facilisis, scelerisque mi commodo, scelerisque tortor. Nulla efficitur imperdiet urna et faucibus.";
    			t35 = space();
    			h22 = element("h2");
    			h22.textContent = "Section Subhead";
    			t37 = space();
    			p11 = element("p");
    			p11.textContent = "Vestibulum sollicitudin felis sed tortor vulputate laoreet. Cras venenatis condimentum lacus id suscipit. Ut id pretium orci. Vestibulum scelerisque elit sollicitudin bibendum sagittis. Nam non diam cursus, scelerisque orci quis, mattis ligula. Cras ac orci porta, tristique leo sed, pulvinar massa. Vivamus a luctus nunc, eget scelerisque dui. Fusce sit amet nibh pharetra erat pretium ullamcorper quis vitae ipsum. Phasellus accumsan id erat ac tempor. Nulla et dolor fringilla ipsum molestie varius ut eget lacus. Integer varius tortor non dui malesuada, vitae condimentum sapien pretium. Nunc bibendum dolor nisl, id blandit metus finibus ac. Pellentesque suscipit, velit ac vestibulum hendrerit, lectus turpis consequat velit, sed dignissim justo ligula eu elit. Pellentesque quis tellus eu magna laoreet hendrerit vel sit amet orci. Nulla sit amet laoreet orci, et gravida dui. Cras lacinia tellus ac dignissim pharetra.";
    			t39 = space();
    			p12 = element("p");
    			p12.textContent = "Fusce id nisi at nibh porta auctor. Phasellus at posuere neque, vitae vulputate nibh. Donec pulvinar quam id facilisis suscipit. Ut egestas sit amet nibh sit amet dignissim. Morbi vel neque tellus. Phasellus ultricies nibh eget nibh faucibus, ut tincidunt tortor vulputate. Etiam tempus urna dolor, id volutpat nulla faucibus in. Donec rutrum euismod turpis, vitae sagittis neque interdum ac. Fusce porta metus sed ornare tincidunt. Fusce accumsan sit amet nunc nec volutpat. Nam tempor sollicitudin tincidunt. Sed aliquam metus odio, eget euismod velit varius at. Ut ac ante nec libero luctus accumsan id ac nulla. In hac habitasse platea dictumst. Pellentesque bibendum sollicitudin consectetur. Pellentesque nibh lectus, ullamcorper non urna eget, rhoncus dictum ante.";
    			t41 = space();
    			h32 = element("h3");
    			h32.textContent = "Section Subhead";
    			t43 = space();
    			p13 = element("p");
    			p13.textContent = "Proin id finibus lectus. Fusce bibendum, elit nec faucibus elementum, sem dui varius turpis, nec mattis lacus dui et libero. Vestibulum posuere sem ut magna interdum bibendum. Duis vitae porttitor diam. Sed metus dolor, mollis vitae nisl quis, ultrices ullamcorper metus. Curabitur diam erat, fermentum vel porta vitae, efficitur vel arcu. Maecenas nec congue tellus. Integer fermentum pharetra felis vel vulputate. Nulla fringilla magna dolor. Nullam vehicula dui fringilla faucibus tristique. Pellentesque at quam gravida purus rhoncus imperdiet quis ac dolor. In viverra, magna vitae tristique efficitur, purus ex fermentum felis, in scelerisque ipsum felis ut lacus. Nunc mollis feugiat ipsum, id bibendum mi auctor ultricies. Nunc volutpat purus et ullamcorper rhoncus. Aliquam nec tellus et odio interdum euismod ut nec diam.";
    			t45 = space();
    			p14 = element("p");
    			p14.textContent = "Nullam ultricies lacus sem, eu venenatis magna aliquam a. Donec vel justo tortor. Aenean venenatis at metus et auctor. Nam nulla sem, viverra quis fringilla in, luctus non arcu. Morbi gravida enim odio, a porttitor arcu sollicitudin a. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In vitae ullamcorper magna. Duis vel risus vel augue placerat rutrum. Cras nec vulputate elit. Ut dignissim condimentum placerat. Aenean felis dui, porttitor id rhoncus ac, interdum non ante.";
    			t47 = space();
    			section3 = element("section");
    			h13 = element("h1");
    			h13.textContent = "Section 4 Content";
    			t49 = space();
    			p15 = element("p");
    			p15.textContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer non leo a lacus feugiat ullamcorper. Aliquam finibus tincidunt velit vel congue. Aliquam ut sodales tortor. Pellentesque ut condimentum diam, sed ultrices justo. Mauris neque risus, aliquam nec arcu at, vulputate sollicitudin est. Aliquam laoreet nisi quis augue bibendum tristique. Nunc ultrices mauris lectus, viverra elementum velit consequat vel. Phasellus eu pharetra nibh. Nullam eget quam facilisis, scelerisque mi commodo, scelerisque tortor. Nulla efficitur imperdiet urna et faucibus.";
    			t51 = space();
    			h23 = element("h2");
    			h23.textContent = "Section Subhead";
    			t53 = space();
    			p16 = element("p");
    			p16.textContent = "Vestibulum sollicitudin felis sed tortor vulputate laoreet. Cras venenatis condimentum lacus id suscipit. Ut id pretium orci. Vestibulum scelerisque elit sollicitudin bibendum sagittis. Nam non diam cursus, scelerisque orci quis, mattis ligula. Cras ac orci porta, tristique leo sed, pulvinar massa. Vivamus a luctus nunc, eget scelerisque dui. Fusce sit amet nibh pharetra erat pretium ullamcorper quis vitae ipsum. Phasellus accumsan id erat ac tempor. Nulla et dolor fringilla ipsum molestie varius ut eget lacus. Integer varius tortor non dui malesuada, vitae condimentum sapien pretium. Nunc bibendum dolor nisl, id blandit metus finibus ac. Pellentesque suscipit, velit ac vestibulum hendrerit, lectus turpis consequat velit, sed dignissim justo ligula eu elit. Pellentesque quis tellus eu magna laoreet hendrerit vel sit amet orci. Nulla sit amet laoreet orci, et gravida dui. Cras lacinia tellus ac dignissim pharetra.";
    			t55 = space();
    			p17 = element("p");
    			p17.textContent = "Fusce id nisi at nibh porta auctor. Phasellus at posuere neque, vitae vulputate nibh. Donec pulvinar quam id facilisis suscipit. Ut egestas sit amet nibh sit amet dignissim. Morbi vel neque tellus. Phasellus ultricies nibh eget nibh faucibus, ut tincidunt tortor vulputate. Etiam tempus urna dolor, id volutpat nulla faucibus in. Donec rutrum euismod turpis, vitae sagittis neque interdum ac. Fusce porta metus sed ornare tincidunt. Fusce accumsan sit amet nunc nec volutpat. Nam tempor sollicitudin tincidunt. Sed aliquam metus odio, eget euismod velit varius at. Ut ac ante nec libero luctus accumsan id ac nulla. In hac habitasse platea dictumst. Pellentesque bibendum sollicitudin consectetur. Pellentesque nibh lectus, ullamcorper non urna eget, rhoncus dictum ante.";
    			t57 = space();
    			h33 = element("h3");
    			h33.textContent = "Section Subhead";
    			t59 = space();
    			p18 = element("p");
    			p18.textContent = "Proin id finibus lectus. Fusce bibendum, elit nec faucibus elementum, sem dui varius turpis, nec mattis lacus dui et libero. Vestibulum posuere sem ut magna interdum bibendum. Duis vitae porttitor diam. Sed metus dolor, mollis vitae nisl quis, ultrices ullamcorper metus. Curabitur diam erat, fermentum vel porta vitae, efficitur vel arcu. Maecenas nec congue tellus. Integer fermentum pharetra felis vel vulputate. Nulla fringilla magna dolor. Nullam vehicula dui fringilla faucibus tristique. Pellentesque at quam gravida purus rhoncus imperdiet quis ac dolor. In viverra, magna vitae tristique efficitur, purus ex fermentum felis, in scelerisque ipsum felis ut lacus. Nunc mollis feugiat ipsum, id bibendum mi auctor ultricies. Nunc volutpat purus et ullamcorper rhoncus. Aliquam nec tellus et odio interdum euismod ut nec diam.";
    			t61 = space();
    			p19 = element("p");
    			p19.textContent = "Nullam ultricies lacus sem, eu venenatis magna aliquam a. Donec vel justo tortor. Aenean venenatis at metus et auctor. Nam nulla sem, viverra quis fringilla in, luctus non arcu. Morbi gravida enim odio, a porttitor arcu sollicitudin a. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. In vitae ullamcorper magna. Duis vel risus vel augue placerat rutrum. Cras nec vulputate elit. Ut dignissim condimentum placerat. Aenean felis dui, porttitor id rhoncus ac, interdum non ante.";
    			attr_dev(h10, "class", "svelte-17j2hs");
    			add_location(h10, file$1, 35, 16, 776);
    			add_location(p0, file$1, 36, 16, 819);
    			add_location(h20, file$1, 38, 16, 1403);
    			add_location(p1, file$1, 39, 16, 1444);
    			add_location(p2, file$1, 41, 16, 2395);
    			add_location(h30, file$1, 43, 16, 3191);
    			add_location(p3, file$1, 44, 16, 3232);
    			add_location(p4, file$1, 46, 16, 4088);
    			attr_dev(section0, "class", "svelte-17j2hs");
    			add_location(section0, file$1, 34, 12, 750);
    			attr_dev(h11, "class", "svelte-17j2hs");
    			add_location(h11, file$1, 50, 16, 4672);
    			add_location(p5, file$1, 51, 16, 4715);
    			add_location(h21, file$1, 53, 16, 5299);
    			add_location(p6, file$1, 54, 16, 5340);
    			add_location(p7, file$1, 56, 16, 6291);
    			add_location(h31, file$1, 58, 16, 7087);
    			add_location(p8, file$1, 59, 16, 7128);
    			add_location(p9, file$1, 61, 16, 7984);
    			attr_dev(section1, "class", "svelte-17j2hs");
    			add_location(section1, file$1, 49, 12, 4646);
    			attr_dev(h12, "class", "svelte-17j2hs");
    			add_location(h12, file$1, 65, 16, 8568);
    			add_location(p10, file$1, 66, 16, 8611);
    			add_location(h22, file$1, 68, 16, 9195);
    			add_location(p11, file$1, 69, 16, 9236);
    			add_location(p12, file$1, 71, 16, 10187);
    			add_location(h32, file$1, 73, 16, 10983);
    			add_location(p13, file$1, 74, 16, 11024);
    			add_location(p14, file$1, 76, 16, 11880);
    			attr_dev(section2, "class", "svelte-17j2hs");
    			add_location(section2, file$1, 64, 12, 8542);
    			attr_dev(h13, "class", "svelte-17j2hs");
    			add_location(h13, file$1, 80, 16, 12464);
    			add_location(p15, file$1, 81, 16, 12507);
    			add_location(h23, file$1, 83, 16, 13091);
    			add_location(p16, file$1, 84, 16, 13132);
    			add_location(p17, file$1, 86, 16, 14083);
    			add_location(h33, file$1, 88, 16, 14879);
    			add_location(p18, file$1, 89, 16, 14920);
    			add_location(p19, file$1, 91, 16, 15776);
    			attr_dev(section3, "class", "svelte-17j2hs");
    			add_location(section3, file$1, 79, 12, 12438);
    			attr_dev(div0, "class", "scroll-container svelte-17j2hs");
    			add_location(div0, file$1, 33, 8, 707);
    			attr_dev(div1, "slot", "foreground");
    			add_location(div1, file$1, 32, 4, 675);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, section0);
    			append_dev(section0, h10);
    			append_dev(section0, t1);
    			append_dev(section0, p0);
    			append_dev(section0, t3);
    			append_dev(section0, h20);
    			append_dev(section0, t5);
    			append_dev(section0, p1);
    			append_dev(section0, t7);
    			append_dev(section0, p2);
    			append_dev(section0, t9);
    			append_dev(section0, h30);
    			append_dev(section0, t11);
    			append_dev(section0, p3);
    			append_dev(section0, t13);
    			append_dev(section0, p4);
    			append_dev(div0, t15);
    			append_dev(div0, section1);
    			append_dev(section1, h11);
    			append_dev(section1, t17);
    			append_dev(section1, p5);
    			append_dev(section1, t19);
    			append_dev(section1, h21);
    			append_dev(section1, t21);
    			append_dev(section1, p6);
    			append_dev(section1, t23);
    			append_dev(section1, p7);
    			append_dev(section1, t25);
    			append_dev(section1, h31);
    			append_dev(section1, t27);
    			append_dev(section1, p8);
    			append_dev(section1, t29);
    			append_dev(section1, p9);
    			append_dev(div0, t31);
    			append_dev(div0, section2);
    			append_dev(section2, h12);
    			append_dev(section2, t33);
    			append_dev(section2, p10);
    			append_dev(section2, t35);
    			append_dev(section2, h22);
    			append_dev(section2, t37);
    			append_dev(section2, p11);
    			append_dev(section2, t39);
    			append_dev(section2, p12);
    			append_dev(section2, t41);
    			append_dev(section2, h32);
    			append_dev(section2, t43);
    			append_dev(section2, p13);
    			append_dev(section2, t45);
    			append_dev(section2, p14);
    			append_dev(div0, t47);
    			append_dev(div0, section3);
    			append_dev(section3, h13);
    			append_dev(section3, t49);
    			append_dev(section3, p15);
    			append_dev(section3, t51);
    			append_dev(section3, h23);
    			append_dev(section3, t53);
    			append_dev(section3, p16);
    			append_dev(section3, t55);
    			append_dev(section3, p17);
    			append_dev(section3, t57);
    			append_dev(section3, h33);
    			append_dev(section3, t59);
    			append_dev(section3, p18);
    			append_dev(section3, t61);
    			append_dev(section3, p19);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_foreground_slot.name,
    		type: "slot",
    		source: "(33:4) ",
    		ctx
    	});

    	return block;
    }

    // (96:4) 
    function create_background_slot(ctx) {
    	let div;
    	let canvascomponent;
    	let current;

    	canvascomponent = new CanvasComponent({
    			props: { stepIndex: /*stepIndex*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(canvascomponent.$$.fragment);
    			attr_dev(div, "slot", "background");
    			add_location(div, file$1, 95, 4, 16351);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(canvascomponent, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const canvascomponent_changes = {};
    			if (dirty & /*stepIndex*/ 1) canvascomponent_changes.stepIndex = /*stepIndex*/ ctx[0];
    			canvascomponent.$set(canvascomponent_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(canvascomponent.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(canvascomponent.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(canvascomponent);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_background_slot.name,
    		type: "slot",
    		source: "(96:4) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let scroller_1;
    	let current;

    	let scroller_1_props = {
    		top: /*top*/ ctx[2],
    		threshold: /*threshold*/ ctx[3],
    		bottom: /*bottom*/ ctx[4],
    		$$slots: {
    			background: [create_background_slot],
    			foreground: [create_foreground_slot]
    		},
    		$$scope: { ctx }
    	};

    	scroller_1 = new Scroller({ props: scroller_1_props, $$inline: true });
    	/*scroller_1_binding*/ ctx[5](scroller_1);
    	scroller_1.$on("section", /*section_handler*/ ctx[6]);

    	const block = {
    		c: function create() {
    			create_component(scroller_1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(scroller_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const scroller_1_changes = {};

    			if (dirty & /*$$scope, stepIndex*/ 257) {
    				scroller_1_changes.$$scope = { dirty, ctx };
    			}

    			scroller_1.$set(scroller_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scroller_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scroller_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*scroller_1_binding*/ ctx[5](null);
    			destroy_component(scroller_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ScrollManager', slots, []);
    	let top = 0;
    	let threshold = 0.65;
    	let bottom = 1;
    	let stepIndex = 0;
    	let scroller;

    	function changeStep(newStep) {
    		$$invalidate(0, stepIndex = newStep);
    		console.log(stepIndex);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<ScrollManager> was created with unknown prop '${key}'`);
    	});

    	function scroller_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			scroller = $$value;
    			$$invalidate(1, scroller);
    		});
    	}

    	const section_handler = event => console.log(event);

    	$$self.$capture_state = () => ({
    		Scroller,
    		CanvasComponent,
    		top,
    		threshold,
    		bottom,
    		stepIndex,
    		scroller,
    		changeStep
    	});

    	$$self.$inject_state = $$props => {
    		if ('top' in $$props) $$invalidate(2, top = $$props.top);
    		if ('threshold' in $$props) $$invalidate(3, threshold = $$props.threshold);
    		if ('bottom' in $$props) $$invalidate(4, bottom = $$props.bottom);
    		if ('stepIndex' in $$props) $$invalidate(0, stepIndex = $$props.stepIndex);
    		if ('scroller' in $$props) $$invalidate(1, scroller = $$props.scroller);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		stepIndex,
    		scroller,
    		top,
    		threshold,
    		bottom,
    		scroller_1_binding,
    		section_handler
    	];
    }

    class ScrollManager extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ScrollManager",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let scrollmanager;
    	let current;
    	scrollmanager = new ScrollManager({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(scrollmanager.$$.fragment);
    			attr_dev(main, "class", "svelte-h2iqbm");
    			add_location(main, file, 12, 0, 208);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(scrollmanager, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scrollmanager.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scrollmanager.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(scrollmanager);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ScrollManager });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
