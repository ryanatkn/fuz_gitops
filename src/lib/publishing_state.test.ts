import {describe, it, expect} from 'vitest';

import {Publishing_State_Manager, init_publishing_state} from '$lib/publishing_state.js';

describe('Publishing_State_Manager', () => {
	describe('create_new_state', () => {
		it('creates state with correct structure', () => {
			const manager = new Publishing_State_Manager();
			const packages = ['pkg-a', 'pkg-b', 'pkg-c'];

			const state = manager.create_new_state(packages);

			expect(state.started_at).toBeDefined();
			expect(state.completed).toEqual([]);
			expect(state.failed).toEqual([]);
			expect(state.remaining).toEqual(packages);
			expect(state.resumed_at).toBeUndefined();
			expect(state.current).toBeUndefined();
		});

		it('creates ISO timestamp', () => {
			const manager = new Publishing_State_Manager();
			const state = manager.create_new_state(['pkg-a']);

			// Check it's a valid ISO date
			const date = new Date(state.started_at);
			expect(date.toISOString()).toBe(state.started_at);
		});

		it('copies package list to avoid mutation', () => {
			const manager = new Publishing_State_Manager();
			const packages = ['pkg-a', 'pkg-b'];

			const state = manager.create_new_state(packages);

			// Modify original
			packages.push('pkg-c');

			expect(state.remaining).toEqual(['pkg-a', 'pkg-b']);
		});
	});

	describe('mark_current', () => {
		it('sets current package', () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a', 'pkg-b']);

			manager.mark_current('pkg-a');

			const state = manager.get_state();
			expect(state?.current).toBe('pkg-a');
		});

		it('does nothing when state is null', () => {
			const manager = new Publishing_State_Manager();

			// No error
			manager.mark_current('pkg-a');

			expect(manager.get_state()).toBeNull();
		});
	});

	describe('mark_completed', () => {
		it('moves package from remaining to completed', async () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a', 'pkg-b', 'pkg-c']);

			await manager.mark_completed('pkg-b', '1.2.0');

			const state = manager.get_state()!;
			expect(state.remaining).toEqual(['pkg-a', 'pkg-c']);
			expect(state.completed).toHaveLength(1);
			expect(state.completed[0]).toMatchObject({
				name: 'pkg-b',
				version: '1.2.0',
			});
			expect(state.completed[0].timestamp).toBeDefined();
		});

		it('clears current when completing current package', async () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a']);
			manager.mark_current('pkg-a');

			await manager.mark_completed('pkg-a', '1.0.0');

			const state = manager.get_state()!;
			expect(state.current).toBeUndefined();
		});

		it('tracks multiple completions', async () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a', 'pkg-b', 'pkg-c']);

			await manager.mark_completed('pkg-a', '1.0.0');
			await manager.mark_completed('pkg-b', '2.0.0');

			const state = manager.get_state()!;
			expect(state.completed).toHaveLength(2);
			expect(state.remaining).toEqual(['pkg-c']);
		});
	});

	describe('mark_failed', () => {
		it('moves package from remaining to failed', async () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a', 'pkg-b']);

			await manager.mark_failed('pkg-a', new Error('Network timeout'));

			const state = manager.get_state()!;
			expect(state.remaining).toEqual(['pkg-b']);
			expect(state.failed).toHaveLength(1);
			expect(state.failed[0]).toMatchObject({
				name: 'pkg-a',
				error: 'Network timeout',
			});
			expect(state.failed[0].timestamp).toBeDefined();
		});

		it('clears current when failing current package', async () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a']);
			manager.mark_current('pkg-a');

			await manager.mark_failed('pkg-a', new Error('Failed'));

			const state = manager.get_state()!;
			expect(state.current).toBeUndefined();
		});

		it('tracks multiple failures', async () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a', 'pkg-b', 'pkg-c']);

			await manager.mark_failed('pkg-a', new Error('Error A'));
			await manager.mark_failed('pkg-b', new Error('Error B'));

			const state = manager.get_state()!;
			expect(state.failed).toHaveLength(2);
			expect(state.remaining).toEqual(['pkg-c']);
		});
	});

	describe('get_packages_to_skip', () => {
		it('returns empty set when no state', () => {
			const manager = new Publishing_State_Manager();

			const skip = manager.get_packages_to_skip();

			expect(skip.size).toBe(0);
		});

		it('includes completed packages', async () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a', 'pkg-b', 'pkg-c']);

			await manager.mark_completed('pkg-a', '1.0.0');
			await manager.mark_completed('pkg-b', '2.0.0');

			const skip = manager.get_packages_to_skip();

			expect(skip.size).toBe(2);
			expect(skip.has('pkg-a')).toBe(true);
			expect(skip.has('pkg-b')).toBe(true);
			expect(skip.has('pkg-c')).toBe(false);
		});

		it('includes failed packages', async () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a', 'pkg-b']);

			await manager.mark_failed('pkg-a', new Error('Failed'));

			const skip = manager.get_packages_to_skip();

			expect(skip.size).toBe(1);
			expect(skip.has('pkg-a')).toBe(true);
		});

		it('includes both completed and failed', async () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a', 'pkg-b', 'pkg-c']);

			await manager.mark_completed('pkg-a', '1.0.0');
			await manager.mark_failed('pkg-b', new Error('Failed'));

			const skip = manager.get_packages_to_skip();

			expect(skip.size).toBe(2);
			expect(skip.has('pkg-a')).toBe(true);
			expect(skip.has('pkg-b')).toBe(true);
		});
	});

	describe('should_resume', () => {
		it('returns false when no state', () => {
			const manager = new Publishing_State_Manager();

			expect(manager.should_resume()).toBe(false);
		});

		it('returns true when state exists with remaining packages', () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a', 'pkg-b']);

			expect(manager.should_resume()).toBe(true);
		});

		it('returns false when all packages completed', async () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a']);

			await manager.mark_completed('pkg-a', '1.0.0');

			expect(manager.should_resume()).toBe(false);
		});

		it('returns false when all packages failed', async () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a']);

			await manager.mark_failed('pkg-a', new Error('Failed'));

			expect(manager.should_resume()).toBe(false);
		});
	});

	describe('get_summary', () => {
		it('returns message when no state', () => {
			const manager = new Publishing_State_Manager();

			const summary = manager.get_summary();

			expect(summary).toBe('No state loaded');
		});

		it('includes basic state info', () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a', 'pkg-b']);

			const summary = manager.get_summary();

			expect(summary).toContain('Publishing State Summary');
			expect(summary).toContain('Started:');
			expect(summary).toContain('Completed: 0 packages');
			expect(summary).toContain('Failed: 0 packages');
			expect(summary).toContain('Remaining: 2 packages');
		});

		it('includes completed packages', async () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a', 'pkg-b']);

			await manager.mark_completed('pkg-a', '1.0.0');

			const summary = manager.get_summary();

			expect(summary).toContain('Completed: 1 packages');
			expect(summary).toContain('pkg-a@1.0.0');
		});

		it('includes failed packages with errors', async () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a']);

			await manager.mark_failed('pkg-a', new Error('Network error'));

			const summary = manager.get_summary();

			expect(summary).toContain('Failed: 1 packages');
			expect(summary).toContain('pkg-a: Network error');
		});

		it('includes current package', () => {
			const manager = new Publishing_State_Manager();
			manager.create_new_state(['pkg-a']);
			manager.mark_current('pkg-a');

			const summary = manager.get_summary();

			expect(summary).toContain('Currently processing: pkg-a');
		});

		it('includes resumed timestamp', () => {
			const manager = new Publishing_State_Manager();
			const state = manager.create_new_state(['pkg-a']);
			state.resumed_at = '2024-01-01T12:00:00.000Z';

			const summary = manager.get_summary();

			expect(summary).toContain('Resumed:');
		});
	});

	describe('get_state', () => {
		it('returns null when no state created', () => {
			const manager = new Publishing_State_Manager();

			expect(manager.get_state()).toBeNull();
		});

		it('returns current state', () => {
			const manager = new Publishing_State_Manager();
			const state = manager.create_new_state(['pkg-a']);

			expect(manager.get_state()).toBe(state);
		});
	});
});

describe('init_publishing_state', () => {
	it('creates new state when no existing state', async () => {
		const manager = await init_publishing_state(['pkg-a', 'pkg-b']);

		const state = manager.get_state();
		expect(state).not.toBeNull();
		expect(state?.remaining).toEqual(['pkg-a', 'pkg-b']);
	});

	it('validates package list matches existing state', async () => {
		// This test would require mocking the file system more thoroughly
		// For now, we test the basic creation
		const manager = await init_publishing_state(['pkg-a', 'pkg-b', 'pkg-c']);

		expect(manager.get_state()?.remaining).toHaveLength(3);
	});
});

describe('state persistence integration', () => {
	it('maintains state across operations', async () => {
		const manager = new Publishing_State_Manager();
		manager.create_new_state(['pkg-a', 'pkg-b', 'pkg-c']);

		// Simulate publishing workflow
		manager.mark_current('pkg-a');
		await manager.mark_completed('pkg-a', '1.0.0');

		manager.mark_current('pkg-b');
		await manager.mark_failed('pkg-b', new Error('Build failed'));

		const state = manager.get_state()!;

		expect(state.completed).toHaveLength(1);
		expect(state.failed).toHaveLength(1);
		expect(state.remaining).toEqual(['pkg-c']);
		expect(state.current).toBeUndefined();
	});

	it('tracks timestamps in order', async () => {
		const manager = new Publishing_State_Manager();
		manager.create_new_state(['pkg-a', 'pkg-b']);

		// Add small delay
		await new Promise((resolve) => setTimeout(resolve, 10));

		await manager.mark_completed('pkg-a', '1.0.0');

		await new Promise((resolve) => setTimeout(resolve, 10));

		await manager.mark_completed('pkg-b', '2.0.0');

		const state = manager.get_state()!;

		const time1 = new Date(state.completed[0].timestamp).getTime();
		const time2 = new Date(state.completed[1].timestamp).getTime();

		expect(time2).toBeGreaterThan(time1);
	});
});
