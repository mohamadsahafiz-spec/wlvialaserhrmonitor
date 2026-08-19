(function () {
    function initBeamAnimation() {
        var svgns = 'http://www.w3.org/2000/svg';
        var svg = document.getElementById('lms-beam-svg');
        var defs = document.getElementById('lms-beam-defs');
        var container = document.getElementById('lms-beam-container');
        if (!svg || !container || !defs) return;

        var W, H, minX, maxX, minY, maxY;
        var margin = 6;
        var beams = [];

        function updateBounds() {
            var containerRect = container.getBoundingClientRect();
            if (!containerRect.width) return;

            var header = document.querySelector('.app-header');
            var statsPanel = document.getElementById('fleet-stats-panel');

            var headerRect = header ? header.getBoundingClientRect() : null;
            var statsRect = statsPanel ? statsPanel.getBoundingClientRect() : null;

            var top = (headerRect && containerRect.top > headerRect.bottom) ? (headerRect.bottom - containerRect.top) : 0;
            var bottom = (statsRect && statsRect.top > containerRect.top) ? (statsRect.top - containerRect.top) : containerRect.height;

            W = containerRect.width || 1000;
            H = Math.max(20, bottom - top);

            svg.style.top = top + 'px';
            svg.style.height = H + 'px';
            svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

            minX = margin; maxX = Math.max(margin + 10, W - margin);
            minY = margin; maxY = Math.max(margin + 10, H - margin);

            if (beams && beams.length) {
                beams.forEach(function (b) {
                    b.maxTailLen = Math.max(W, H) * 0.55;
                    b.pos.x = Math.max(minX, Math.min(maxX, b.pos.x));
                    b.pos.y = Math.max(minY, Math.min(maxY, b.pos.y));
                });
            }
        }
        updateBounds();

        var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        function getStatusColors(status) {
            if (status === 'ALARM') {
                return { main: '#ef4444', mid: '#f87171', glowOpacity: 0.75 };
            } else if (status === 'WARNING' || status === 'BASELINE_REQUIRED') {
                return { main: '#f59e0b', mid: '#fbbf24', glowOpacity: 0.60 };
            } else {
                return { main: '#22c55e', mid: '#4ade80', glowOpacity: 0.55 };
            }
        }

        function setBeamColor(b, status) {
            if (b.currentStatus === status) return;
            b.currentStatus = status;
            var colors = getStatusColors(status);

            b.tailGrad.innerHTML = '<stop offset="0" stop-color="#FFFFFF" stop-opacity="0.95"/>' +
                '<stop offset="0.2" stop-color="' + colors.mid + '" stop-opacity="0.65"/>' +
                '<stop offset="1" stop-color="' + colors.main + '" stop-opacity="0"/>';

            b.glowOuter.setAttribute('fill', colors.main);
            b.glowOuter.setAttribute('opacity', String(colors.glowOpacity));
            b.head.setAttribute('fill', colors.main);
            b.impact.setAttribute('fill', colors.main);
        }

        function createBeam(index, machineId) {
            var idSuffix = '_' + index + '_' + Math.floor(Math.random() * 1000000);
            var gradId = 'lmsTailGrad' + idSuffix;

            var grad = document.createElementNS(svgns, 'linearGradient');
            grad.setAttribute('id', gradId);
            grad.setAttribute('gradientUnits', 'userSpaceOnUse');
            defs.appendChild(grad);

            var tail = document.createElementNS(svgns, 'path');
            tail.setAttribute('fill', 'url(#' + gradId + ')');
            svg.appendChild(tail);

            var glowOuter = document.createElementNS(svgns, 'circle');
            glowOuter.setAttribute('r', '13');
            glowOuter.setAttribute('filter', 'url(#lms-blurGlow)');
            svg.appendChild(glowOuter);

            var head = document.createElementNS(svgns, 'circle');
            head.setAttribute('r', '4');
            svg.appendChild(head);

            var impact = document.createElementNS(svgns, 'circle');
            impact.setAttribute('r', '0');
            impact.setAttribute('opacity', '0');
            svg.appendChild(impact);

            var speedFactor = 0.45 + Math.random() * 0.3;
            var angle = Math.random() * 360;
            var fx = 0.15 + Math.random() * 0.7;
            var fy = 0.15 + Math.random() * 0.7;

            var s = Math.max(W, H) * (speedFactor / 1000);
            var a = angle * Math.PI / 180;

            var b = {
                machineId: machineId,
                currentStatus: null,
                tail: tail,
                tailGrad: grad,
                glowOuter: glowOuter,
                head: head,
                impact: impact,
                pos: { x: W * fx, y: H * fy },
                vel: { x: s * Math.cos(a), y: s * Math.sin(a) },
                impactAt: -1000,
                impactX: 0,
                impactY: 0,
                maxTailLen: Math.max(W, H) * 0.55,
                halfWidth: 3.4
            };

            return b;
        }

        function destroyBeam(b) {
            if (b.tail && b.tail.parentNode) b.tail.parentNode.removeChild(b.tail);
            if (b.glowOuter && b.glowOuter.parentNode) b.glowOuter.parentNode.removeChild(b.glowOuter);
            if (b.head && b.head.parentNode) b.head.parentNode.removeChild(b.head);
            if (b.impact && b.impact.parentNode) b.impact.parentNode.removeChild(b.impact);
            if (b.tailGrad && b.tailGrad.parentNode) b.tailGrad.parentNode.removeChild(b.tailGrad);
        }

        function fetchCurrentMachines() {
            if (window.AppState && Array.isArray(window.AppState.machines)) {
                return window.AppState.machines;
            }
            if (window.StorageService && typeof window.StorageService.loadMachines === 'function') {
                try {
                    var list = window.StorageService.loadMachines();
                    if (Array.isArray(list)) return list;
                } catch (e) {}
            }
            try {
                var raw = localStorage.getItem('wafer_driller_fleet_v5');
                if (raw) {
                    var parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) return parsed;
                }
            } catch (e) {}
            return [];
        }

        function getMachineStatus(m) {
            if (window.LaserEngine && typeof window.LaserEngine.calculateMachineMetrics === 'function') {
                try {
                    var metrics = window.LaserEngine.calculateMachineMetrics(m, Date.now());
                    if (metrics && metrics.status) {
                        return metrics.status;
                    }
                } catch (e) {}
            }
            return m.status || 'SAFE';
        }

        function syncBeamsWithMachines() {
            var machines = fetchCurrentMachines();

            var currentIds = new Set();
            machines.forEach(function (m) {
                if (m && m.id) currentIds.add(String(m.id));
            });

            // Remove beams whose machines no longer exist
            for (var i = beams.length - 1; i >= 0; i--) {
                var b = beams[i];
                if (!b.machineId || !currentIds.has(String(b.machineId))) {
                    destroyBeam(b);
                    beams.splice(i, 1);
                }
            }

            // Map existing beams by machineId
            var beamMap = {};
            beams.forEach(function (b) {
                if (b.machineId) {
                    beamMap[String(b.machineId)] = b;
                }
            });

            // Create new beams or update color of existing beams
            machines.forEach(function (m, idx) {
                if (!m || !m.id) return;
                var idStr = String(m.id);
                var status = getMachineStatus(m);

                var b = beamMap[idStr];
                if (!b) {
                    b = createBeam(idx, idStr);
                    beams.push(b);
                    if (reduceMotion) draw(b, 0);
                }

                setBeamColor(b, status);
            });
        }

        // Backward compatibility helper
        function syncBeamCount(targetCount) {
            syncBeamsWithMachines();
        }

        function jitter(b) {
            var a = Math.atan2(b.vel.y, b.vel.x);
            a += (Math.random() - 0.5) * 0.35;
            var s = Math.hypot(b.vel.x, b.vel.y);
            b.vel.x = s * Math.cos(a);
            b.vel.y = s * Math.sin(a);
        }

        function distToWall(b, dx, dy) {
            var tX = dx > 0 ? (maxX - b.pos.x) / dx : (dx < 0 ? (minX - b.pos.x) / dx : Infinity);
            var tY = dy > 0 ? (maxY - b.pos.y) / dy : (dy < 0 ? (minY - b.pos.y) / dy : Infinity);
            return Math.max(0, Math.min(tX, tY));
        }

        function draw(b, t) {
            var len = Math.hypot(b.vel.x, b.vel.y) || 1;
            var ux = b.vel.x / len, uy = b.vel.y / len;
            var tdx = -ux, tdy = -uy;
            var tailLen = Math.min(b.maxTailLen, distToWall(b, tdx, tdy));
            var tx = b.pos.x + tdx * tailLen, ty = b.pos.y + tdy * tailLen;
            var px = -uy * b.halfWidth, py = ux * b.halfWidth;
            b.tail.setAttribute('d', 'M ' + (b.pos.x + px) + ',' + (b.pos.y + py) +
                ' L ' + (b.pos.x - px) + ',' + (b.pos.y - py) + ' L ' + tx + ',' + ty + ' Z');
            b.tailGrad.setAttribute('x1', b.pos.x); b.tailGrad.setAttribute('y1', b.pos.y);
            b.tailGrad.setAttribute('x2', tx); b.tailGrad.setAttribute('y2', ty);
            b.glowOuter.setAttribute('cx', b.pos.x); b.glowOuter.setAttribute('cy', b.pos.y);
            b.head.setAttribute('cx', b.pos.x); b.head.setAttribute('cy', b.pos.y);
            var age = t - b.impactAt;
            if (age < 220) {
                b.impact.setAttribute('cx', b.impactX); b.impact.setAttribute('cy', b.impactY);
                b.impact.setAttribute('opacity', String(0.85 * (1 - age / 220)));
                b.impact.setAttribute('r', String(3 * (1 - age / 220) + 4));
            } else {
                b.impact.setAttribute('opacity', '0');
            }
        }

        window.addEventListener('resize', updateBounds);
        window.addEventListener('orientationchange', updateBounds);

        window.updateBeamCount = syncBeamCount;
        window.addEventListener('lms-fleet-updated', function () {
            syncBeamsWithMachines();
        });

        // Initial sync
        syncBeamsWithMachines();

        if (reduceMotion) {
            beams.forEach(function (b) { draw(b, 0); });
        } else {
            var last = null;
            function frame(t) {
                syncBeamsWithMachines();

                if (document.visibilityState === 'hidden') {
                    last = null;
                    requestAnimationFrame(frame);
                    return;
                }
                if (last === null) last = t;
                var dt = Math.min(t - last, 40);
                last = t;
                beams.forEach(function (b) {
                    b.pos.x += b.vel.x * dt; b.pos.y += b.vel.y * dt;
                    if (b.pos.x < minX) { b.pos.x = minX; b.vel.x = -b.vel.x; jitter(b); b.impactAt = t; b.impactX = minX; b.impactY = b.pos.y; }
                    if (b.pos.x > maxX) { b.pos.x = maxX; b.vel.x = -b.vel.x; jitter(b); b.impactAt = t; b.impactX = maxX; b.impactY = b.pos.y; }
                    if (b.pos.y < minY) { b.pos.y = minY; b.vel.y = -b.vel.y; jitter(b); b.impactAt = t; b.impactX = b.pos.x; b.impactY = minY; }
                    if (b.pos.y > maxY) { b.pos.y = maxY; b.vel.y = -b.vel.y; jitter(b); b.impactAt = t; b.impactX = b.pos.x; b.impactY = maxY; }
                    draw(b, t);
                });
                requestAnimationFrame(frame);
            }
            requestAnimationFrame(frame);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initBeamAnimation);
    } else {
        initBeamAnimation();
    }
})();

