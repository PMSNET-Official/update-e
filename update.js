// ==UserScript==
// @name         升学e网通精准检测助手
// @namespace    https://github.com/PMSNET-Official/update-e
// @version      2.1
// @description  精准定位特定按钮，避免误点击
// @match        https://teacher.ewt360.com/*
// @grant        GM_addStyle
// @grant        GM_log
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // 精准定位配置
    const TARGET_BUTTON = {
        // 特定元素选择器
        selector: 'span.btn-3LStS',

        // 按钮文本内容
        text: '点击通过检查',

        // 最大等待时间（毫秒）
        maxWaitTime: 35000,

        // 状态检查间隔（毫秒）
        checkInterval: 500,

        // 点击前延迟（毫秒）
        clickDelay: 1500,

        // 启用日志
        debug: true,

        // 启用视觉反馈
        visualFeedback: true
    };

    // 创建状态指示器
    let statusPanel = null;
    function createStatusPanel() {
        statusPanel = document.createElement('div');
        statusPanel.id = 'ewt-helper-status';
        statusPanel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 30, 60, 0.9);
            color: #00c6ff;
            padding: 12px 20px;
            border-radius: 10px;
            font-family: 'Microsoft YaHei', sans-serif;
            z-index: 99999;
            border: 1px solid rgba(0, 198, 255, 0.5);
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            font-size: 14px;
            max-width: 300px;
            transition: all 0.3s;
            backdrop-filter: blur(4px);
        `;
        statusPanel.innerHTML = '升学e网通助手：正在初始化...';
        document.body.appendChild(statusPanel);
        return statusPanel;
    }

    // 更新状态
    function updateStatus(message, isSuccess = false) {
        if (statusPanel) {
            statusPanel.textContent = `升学e网通助手：${message}`;
            statusPanel.style.color = isSuccess ? '#4ade80' : '#00c6ff';
            statusPanel.style.display = 'block';

            // 3秒后淡出
            clearTimeout(statusPanel.timeout);
            statusPanel.timeout = setTimeout(() => {
                statusPanel.style.opacity = '0.7';
            }, 3000);
        }
        if (TARGET_BUTTON.debug) {
            console.log(`[升学e网通助手] ${message}`);
        }
    }

    // 精准定位目标按钮
    function findTargetButton() {
        // 使用精确选择器查找
        const buttons = document.querySelectorAll(TARGET_BUTTON.selector);

        for (const button of buttons) {
            // 验证文本内容
            const btnText = (button.textContent || '').trim();
            if (btnText === TARGET_BUTTON.text) {
                // 验证元素可见性
                if (isElementVisible(button)) {
                    return button;
                }
            }
        }
        return null;
    }

    // 检查元素是否可见
    function isElementVisible(element) {
        if (!element) return false;

        // 检查基本可见性
        if (element.offsetWidth === 0 || element.offsetHeight === 0) return false;

        const style = window.getComputedStyle(element);
        return style.display !== 'none' &&
               style.visibility !== 'hidden' &&
               style.opacity !== '0' &&
               element.offsetParent !== null;
    }

    // 处理目标按钮
    function handleTargetButton(button) {
        updateStatus(`找到目标按钮，等待可点击状态...`);

        const startTime = Date.now();
        const timer = setInterval(() => {
            // 检查按钮是否可点击
            if (isButtonClickable(button)) {
                clearInterval(timer);
                performClick(button);
                return;
            }

            // 检查是否超时
            if (Date.now() - startTime > TARGET_BUTTON.maxWaitTime) {
                clearInterval(timer);
                updateStatus('等待超时，尝试强制点击');
                forceClick(button);
            }
        }, TARGET_BUTTON.checkInterval);
    }

    // 执行点击操作
    function performClick(button) {
        setTimeout(() => {
            try {
                // 添加视觉反馈
                if (TARGET_BUTTON.visualFeedback) {
                    const originalBoxShadow = button.style.boxShadow;
                    const originalTransition = button.style.transition;

                    button.style.boxShadow = '0 0 15px rgba(0, 198, 255, 0.8), inset 0 0 10px rgba(0, 198, 255, 0.6)';
                    button.style.transition = 'box-shadow 0.5s';

                    setTimeout(() => {
                        button.style.boxShadow = originalBoxShadow;
                        button.style.transition = originalTransition;
                    }, 2500);
                }

                // 执行点击
                button.click();
                updateStatus('成功点击目标按钮', true);

            } catch (e) {
                updateStatus(`点击失败: ${e.message}`);
                forceClick(button);
            }
        }, TARGET_BUTTON.clickDelay);
    }

    // 强制点击（备选方案）
    function forceClick(button) {
        try {
            // 移除禁用状态
            button.removeAttribute('disabled');
            button.classList.remove('disabled', 'is-disabled', 'ant-btn-disabled');

            // 触发鼠标事件
            const mouseEvents = ['mousedown', 'mouseup', 'click'];
            mouseEvents.forEach(eventType => {
                const event = new MouseEvent(eventType, {
                    view: window,
                    bubbles: true,
                    cancelable: true
                });
                button.dispatchEvent(event);
            });

            updateStatus('已执行强制点击操作');

            // 添加视觉反馈（红色高亮）
            if (TARGET_BUTTON.visualFeedback) {
                button.style.backgroundColor = '#ff0000';
                button.style.color = '#ffffff';
                setTimeout(() => {
                    button.style.backgroundColor = '';
                    button.style.color = '';
                }, 3000);
            }
        } catch (e) {
            updateStatus(`强制点击失败: ${e.message}`);
        }
    }

    // 检查按钮是否可点击
    function isButtonClickable(button) {
        if (!button) return false;

        return !button.disabled &&
               !button.classList.contains('disabled') &&
               !button.classList.contains('is-disabled') &&
               !button.classList.contains('ant-btn-disabled') &&
               !button.classList.contains('el-button--disabled');
    }

    // 初始化MutationObserver
    function initObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    // 检查新增的节点
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) { // 元素节点
                            if (node.matches && node.matches(TARGET_BUTTON.selector)) {
                                // 检查文本内容
                                const btnText = (node.textContent || '').trim();
                                if (btnText === TARGET_BUTTON.text) {
                                    updateStatus('检测到目标按钮出现');
                                    handleTargetButton(node);
                                    return;
                                }
                            }

                            // 检查子节点
                            const buttons = node.querySelectorAll ? node.querySelectorAll(TARGET_BUTTON.selector) : [];
                            for (const button of buttons) {
                                const btnText = (button.textContent || '').trim();
                                if (btnText === TARGET_BUTTON.text) {
                                    updateStatus('检测到目标按钮出现');
                                    handleTargetButton(button);
                                    return;
                                }
                            }
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });

        updateStatus('已启动DOM变化监听');
        return observer;
    }

    // 添加手动触发按钮
    function addManualTrigger() {
        const triggerBtn = document.createElement('button');
        triggerBtn.id = 'ewt-manual-trigger';
        triggerBtn.textContent = '手动检测';
        triggerBtn.style.cssText = `
            position: fixed;
            bottom: 60px;
            right: 20px;
            background: linear-gradient(135deg, #00c6ff, #0072ff);
            color: white;
            border: none;
            border-radius: 50px;
            padding: 10px 20px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 100000;
            transition: all 0.3s;
        `;

        triggerBtn.addEventListener('click', () => {
            const button = findTargetButton();
            if (button) {
                updateStatus('手动触发检测到目标按钮');
                handleTargetButton(button);
            } else {
                updateStatus('未找到目标按钮');
            }
        });

        document.body.appendChild(triggerBtn);
        return triggerBtn;
    }

    // 主函数
    function main() {
        // 创建状态面板
        createStatusPanel();

        // 添加手动触发按钮
        addManualTrigger();

        // 初始查找
        const initialButton = findTargetButton();
        if (initialButton) {
            updateStatus('发现已有目标按钮');
            handleTargetButton(initialButton);
        }

        // 启动监听
        initObserver();

        // 定时检查（备用）
        setInterval(() => {
            const button = findTargetButton();
            if (button) {
                updateStatus('定时检查发现目标按钮');
                handleTargetButton(button);
            }
        }, 8000);

        updateStatus('脚本已成功启动');
    }

    // DOM加载完成后启动
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(main, 1000);
    } else {
        document.addEventListener('DOMContentLoaded', main);
    }
})();
