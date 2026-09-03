<script lang="ts">
	import { browser } from '$app/environment';
	import { m } from '$lib/paraglide/messages';
	import {
		GitCommitHorizontal,
		GitBranch,
		Star,
		GitFork,
		CircleDot,
		GitPullRequest,
		Tag,
		Activity
	} from 'lucide-svelte';
	import SectionHeaderMarquee from './section-header-marquee.svelte';
	import { gsapStaggerReveal } from '$lib/util/gsap-reveal';

	const GITHUB_USER = 'driver005';
	const LIMIT = 6;

	interface ActivityItem {
		id: string;
		icon: typeof Activity;
		label: string;
		repo: string;
		url: string;
		date: Date;
	}

	function describe(event: any): { label: string; icon: typeof Activity } | null {
		const repo = event.repo?.name ?? '';
		switch (event.type) {
			case 'PushEvent': {
				const n = event.payload?.commits?.length ?? 1;
				return {
					label: m['activity.pushed']({ n: String(n), repo }),
					icon: GitCommitHorizontal
				};
			}
			case 'CreateEvent':
				return {
					label: m['activity.created']({ type: event.payload?.ref_type ?? 'repo', repo }),
					icon: GitBranch
				};
			case 'WatchEvent':
				return { label: m['activity.starred']({ repo }), icon: Star };
			case 'ForkEvent':
				return { label: m['activity.forked']({ repo }), icon: GitFork };
			case 'IssuesEvent':
				return {
					label: m['activity.issue']({ action: event.payload?.action ?? 'updated', repo }),
					icon: CircleDot
				};
			case 'PullRequestEvent':
				return {
					label: m['activity.pr']({ action: event.payload?.action ?? 'updated', repo }),
					icon: GitPullRequest
				};
			case 'ReleaseEvent':
				return { label: m['activity.release']({ repo }), icon: Tag };
			default:
				return null;
		}
	}

	function timeAgo(date: Date, now: Date) {
		const seconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));
		const units: [number, string][] = [
			[31536000, 'y'],
			[2592000, 'mo'],
			[86400, 'd'],
			[3600, 'h'],
			[60, 'm']
		];
		for (const [secs, label] of units) {
			const v = Math.floor(seconds / secs);
			if (v >= 1) return m['activity.time_ago']({ value: String(v), unit: label });
		}
		return m['activity.just_now']();
	}

	let items = $state<ActivityItem[]>([]);
	let status = $state<'loading' | 'ready' | 'error'>('loading');
	let now = $state<Date | null>(null);
	let listRef: HTMLElement | null = $state(null);

	$effect(() => {
		if (!browser) return;
		now = new Date();
		fetch(`https://api.github.com/users/${GITHUB_USER}/events/public`)
			.then((res) => {
				if (!res.ok) throw new Error('bad response');
				return res.json();
			})
			.then((events: any[]) => {
				const mapped: ActivityItem[] = [];
				for (const e of events) {
					const d = describe(e);
					if (!d) continue;
					mapped.push({
						id: e.id,
						icon: d.icon,
						label: d.label,
						repo: e.repo?.name ?? '',
						url: `https://github.com/${e.repo?.name ?? ''}`,
						date: new Date(e.created_at)
					});
					if (mapped.length >= LIMIT) break;
				}
				if (mapped.length === 0) throw new Error('no events');
				items = mapped;
				status = 'ready';
			})
			.catch(() => {
				status = 'error';
			});
	});

	$effect(() => {
		if (!browser || !listRef || status !== 'ready') return;
		return gsapStaggerReveal(listRef, { selector: 'a' });
	});
</script>

{#if status !== 'error'}
	<section
		id="activity"
		data-testid="recent-activity-section"
		class="border-b border-black bg-[#F3F2EE]"
	>
		<SectionHeaderMarquee
			text="{m['activity.meta']()} × {m['activity.meta_sub']()}"
			separator="●"
		/>

		{#if status === 'loading'}
			<div class="space-y-3">
				{#each { length: 4 } as _}
					<div class="h-12 animate-pulse bg-black/5 sm:h-14"></div>
				{/each}
			</div>
		{:else}
			<div bind:this={listRef}>
				{#each items as item, i (item.id)}
					<a
						href={item.url}
						target="_blank"
						rel="noopener noreferrer"
						data-cursor="hover"
						class="group flex items-center gap-4 sm:gap-6 {i < items.length - 1
							? 'border-0.5 border-b border-black'
							: ''} px-4 py-4 text-[#0A0A0A] no-underline transition-colors duration-300 hover:bg-[#0A0A0A] hover:text-[#F3F2EE] sm:px-6 sm:py-5"
					>
						<span class="w-6 shrink-0 font-mono text-xs opacity-50"
							>{String(i + 1).padStart(2, '0')}</span
						>
						<item.icon class="h-4 w-4 shrink-0 text-[#FF3B00]" />
						<span class="flex-1 truncate font-mono text-sm lowercase sm:text-base"
							>{item.label}</span
						>
						{#if now}
							<span class="shrink-0 font-mono text-xs tracking-[0.2em] uppercase opacity-60"
								>{timeAgo(item.date, now)}</span
							>
						{/if}
					</a>
				{/each}
			</div>
		{/if}
	</section>
{/if}
