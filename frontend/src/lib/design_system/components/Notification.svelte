<script lang="ts">
    export let title: string = "Title.";
    export let subtitle: string = "Subtitle.";
    export let subtitle01: string = "Subtitle.";
    export let action: string = "Action";
    export let buttonText: string = "Action";
    export let onAction: () => void = () => {};
    export let onClose: () => void = () => {};
</script>

<div class="type-info">
    <div class="top">
        <div class="icon">
            <div class="icon-info">
                <div class="vector"></div>
            </div>
        </div>
        <div class="content">
            <div class="title-subtitle">
                <span class="title">{title}</span>
                <span class="subtitle">{subtitle}</span>
            </div>
            <div class="bottom-subtitle">
                <span class="subtitle01">{subtitle01}</span>
            </div>
        </div>
        <div class="right">
            <div class="action" on:click={onAction}>
                <span class="action01">{action}</span>
            </div>
            <div class="close" on:click={onClose}>
                <div class="icon-close">
                    <div class="vector01"></div>
                </div>
            </div>
        </div>
    </div>
    <div class="bottom">
        <button class="button" on:click={onAction}>
            <div class="text-container">
                <span class="button-text">{buttonText}</span>
            </div>
        </button>
    </div>
</div>

<style>
    .type-info {
        width: 449px;
        padding-left: 16px;
        background: linear-gradient(
                0deg,
                rgba(2, 68, 207, 0.1) 0%,
                rgba(2, 68, 207, 0.1) 100%
            ),
            white;
        border-left: 3px #0f62fe solid;
        display: inline-flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
    }
    .top {
        align-self: stretch;
        display: inline-flex;
        justify-content: flex-start;
        align-items: flex-start;
        gap: 16px;
    }
    .icon {
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    }
    .icon-info {
        width: 24px;
        height: 24px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .vector {
        width: 20px;
        height: 20px;
        position: absolute;
        left: 2px;
        top: 2px;
        background: #0f62fe;
        border-radius: 50%;
    }
    .content {
        flex: 1 1 0;
        padding-top: 14px;
        display: inline-flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: flex-start;
    }
    .title-subtitle {
        align-self: stretch;
        display: inline-flex;
        justify-content: flex-start;
        align-items: center;
        gap: 4px;
    }
    .title {
        color: #21272a;
        font-size: 14px;
        font-family: Roboto, Arial, sans-serif;
        font-weight: 500;
        line-height: 15.4px;
        word-wrap: break-word;
    }
    .subtitle {
        color: #21272a;
        font-size: 14px;
        font-family: Roboto, Arial, sans-serif;
        font-weight: 400;
        line-height: 19.6px;
        word-wrap: break-word;
    }
    .bottom-subtitle {
        align-self: stretch;
        padding-bottom: 16px;
        display: inline-flex;
        justify-content: flex-start;
        align-items: flex-start;
        gap: 10px;
    }
    .subtitle01 {
        color: #21272a;
        font-size: 14px;
        font-family: Roboto, Arial, sans-serif;
        font-weight: 400;
        line-height: 19.6px;
        word-wrap: break-word;
    }
    .right {
        height: 48px;
        display: flex;
        justify-content: flex-end;
        align-items: center;
    }
    .action {
        padding: 8px 16px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .action01 {
        color: #0f62fe;
        font-size: 14px;
        font-family: Roboto, Arial, sans-serif;
        font-weight: 400;
        line-height: 19.6px;
        word-wrap: break-word;
        cursor: pointer;
    }
    .close {
        width: 48px;
        height: 48px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
        cursor: pointer;
    }
    .icon-close {
        width: 24px;
        height: 24px;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .vector01 {
        width: 10.51px;
        height: 10.51px;
        position: absolute;
        left: 6.64px;
        top: 6.64px;
        background: #21272a;
        border-radius: 2px;
    }
    .bottom {
        padding: 16px 0 16px 40px;
        display: inline-flex;
        justify-content: flex-start;
        align-items: flex-start;
        gap: 16px;
    }
    .button {
        height: 48px;
        padding: 16px 12px;
        outline: 2px #0f62fe solid;
        outline-offset: -2px;
        display: flex;
        justify-content: center;
        align-items: center;
        background: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    .text-container {
        padding: 0 16px;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 10px;
    }
    .button-text {
        color: #0f62fe;
        font-size: 16px;
        font-family: Roboto, Arial, sans-serif;
        font-weight: 500;
        line-height: 16px;
        letter-spacing: 0.5px;
        word-wrap: break-word;
    }
</style>
