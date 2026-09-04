<!-- Decorative "incoming call" widget — pure DOM/CSS, slides up on hover, opens /home on click. -->
<script lang="ts">
	import { Signal, Wifi, BatteryFull, PhoneIncoming } from 'lucide-svelte';
</script>

<a
	href="/home"
	target="_blank"
	rel="noopener noreferrer"
	class="call-screen"
	aria-label="Incoming call from Home — open the home page in a new tab"
>
	<div class="status-bar">
		<span class="time">9:41</span>
		<span class="status-icons">
			<Signal size={11} strokeWidth={2.5} />
			<Wifi size={11} strokeWidth={2.5} />
			<BatteryFull size={13} strokeWidth={2} />
		</span>
	</div>
	<div class="call-body">
		<div class="avatar"><PhoneIncoming size={22} strokeWidth={1.75} /></div>
		<div class="caller-id">Home</div>
		<div class="subtitle">Incoming call…</div>
	</div>
</a>

<style>
	.call-screen {
		position: fixed;
		left: 24px;
		bottom: 0;
		z-index: 30;
		width: 200px;
		height: 300px;
		padding: 12px 14px 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 18px;
		border: none;
		border-radius: 24px 24px 0 0;
		background: linear-gradient(180deg, #23233a 0%, #101018 70%);
		box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.45);
		color: white;
		font-family: inherit;
		text-decoration: none;
		cursor: pointer;
		/* Resting: only the status bar pokes above the viewport bottom. */
		transform: translateY(calc(100% - 52px));
		transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	.call-screen:hover,
	.call-screen:focus-visible {
		/* Reveal avatar/caller-id/subtitle. */
		transform: translateY(calc(100% - 190px)) scale(1.04);
	}
	.status-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		font-size: 11px;
		font-variant-numeric: tabular-nums;
		opacity: 0.85;
	}
	.status-icons {
		display: flex;
		align-items: center;
		gap: 4px;
	}
	.call-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
	}
	.avatar {
		width: 44px;
		height: 44px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.1);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.caller-id {
		font-size: 16px;
		font-weight: 600;
		letter-spacing: 0.02em;
	}
	.subtitle {
		font-size: 11px;
		opacity: 0.6;
		text-transform: uppercase;
		letter-spacing: 0.15em;
	}
</style>
