declare module '$lib/deployments.json' {
	import type {Deployment} from '$lib/fetch_deployments.js';
	const data: Deployment[];
	export default data;
}
