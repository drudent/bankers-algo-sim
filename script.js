// Allow only digits 0–9 in #numResources
document.getElementById('numResources').addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
});

// Allow only digits 0–9 in #numProcesses
document.getElementById('numProcesses').addEventListener('input', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
});

$(document).on('input', '.only-digit', function () {
    this.value = this.value.replace(/[^0-9]/g, '');
});

$('#numResources').on('keyup input', function () {
    const value = $(this).val().trim();
    
    if (value === '' || parseInt(value) <= 0) {
        $('#numProcesses').prop('disabled', true);
    } else {
        $('#numProcesses').prop('disabled', false);
    }
});

$(document).ready(function() {
    // Reset ketika refresh
    $('#numResources').val('');
    $('#numProcesses').val('');

    // Proses kolom
    $('#numResources').keyup(function () {
        this.value = this.value.replace(/[^0-9]/g, ''); // Only allow digits 0–9

        $('#numProcesses').val('');
        $('#alloTable tr:not(#alloResourceRowhead)').remove();
        $('#maxTable tr:not(#maxResourceRowhead)').remove();

        // Bersihkan header kolom & input availability
        $('#alloResourceRowhead td:not(#alloResourceCol)').remove();
        $('#maxResourceRowhead td:not(#maxResourceCol)').remove();
        $('#availResourceRowhead td:not(#availResourceCol)').remove();
        $('#availResourceInput td:not(#availResourceInputCol)').remove();

        // Hapus tombol "Hitung" yang sudah ada
        $('#btn button').remove();

        var resourceCol = parseInt(this.value);

        // Jika input tidak valid atau kosong, hentikan proses di sini
        if (!resourceCol || resourceCol <= 0) {
            return;
        }

        // Tambah header dan input resource
        for (var i = 1; i <= resourceCol; i++) {
            var col = $('<td><strong>R' + i + '</strong></td>');
            var availRow = $('<td><input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" id="a' + i + '" class="form-control only-digit"></td>');

            $('#alloResourceRowhead').append(col);
            $('#maxResourceRowhead').append(col.clone());
            $('#availResourceRowhead').append(col.clone());
            $('#availResourceInput').append(availRow);
        }

        // Tambahkan tombol baru jika input valid
        var hitungBtn = $('<button id="hitung-btn" type="button" class="btn btn-primary mt-3 me-3" onclick="isSafeState()">Hitung</button>');
        $('#btn').append(hitungBtn);
    });

    // Proses baris
    $('#numProcesses').on('input', function () {
        this.value = this.value.replace(/[^0-9]/g, ''); // Only allow digits 0–9

        $('#alloTable tr:not(#alloResourceRowhead)').remove();
        $('#maxTable tr:not(#maxResourceRowhead)').remove();

        var processRow = parseInt(this.value) || 0;
        var numResources = parseInt($('#numResources').val()) || 0;

        for (var i = 1; i <= processRow; i++) {
            var alloRow = $('<tr><td>P' + i + '</td></tr>');
            var maxRow = $('<tr><td>P' + i + '</td></tr>');
            for (var j = 1; j <= numResources; j++) {
                alloRow.append(
                    '<td><input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" id="a' + i + j + '" class="form-control only-digit"></td>'
                );
                maxRow.append(
                    '<td><input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" id="a' + i + j + '" class="form-control only-digit"></td>'
                );
            }
            $('#alloTable').append(alloRow);
            $('#maxTable').append(maxRow);
        }
    });
});

function isSafeState() {
    const n = parseInt($('#numProcesses').val());
    const m = parseInt($('#numResources').val());

    if (!n || !m) {
        alert("Jumlah proses dan sumber daya harus diisi!");
        return;
    }

    const allocation = [], max = [], processOrder = [], safeSequence = [];
    const available = [];

    // Ambil input allocation dan max
    for (let i = 1; i <= n; i++) {
        const allocRow = [], maxRow = [];
        for (let j = 1; j <= m; j++) {
            const allocVal = $('#alloTable #a' + i + j).val();
            const maxVal = $('#maxTable #a' + i + j).val();
            if (allocVal === '' || maxVal === '') {
                alert("Semua input alokasi dan maksimum harus diisi!");
                return;
            }
            allocRow.push(parseInt(allocVal));
            maxRow.push(parseInt(maxVal));
        }
        allocation.push(allocRow);
        max.push(maxRow);
    }

    // Ambil input available
    for (let i = 1; i <= m; i++) {
        const val = $('#availResourceInput #a' + i).val();
        if (val === '') {
            alert("Input resource availability tidak boleh kosong!");
            return;
        }
        available.push(parseInt(val));
    }

    // Hitung need matrix
    const need = [];
    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < m; j++) {
            row.push(max[i][j] - allocation[i][j]);
        }
        need.push(row);
    }

    const finish = Array(n).fill(false);
    const availableSnapshots = [ [...available] ];
    let completedCount = 0;

    while (completedCount < n) {
        let found = false;

        for (let p = 0; p < n; p++) {
            if (!finish[p]) {
                let canAllocate = true;
                for (let r = 0; r < m; r++) {
                    if (need[p][r] > available[r]) {
                        canAllocate = false;
                        break;
                    }
                }

                if (canAllocate) {
                    for (let r = 0; r < m; r++) {
                        available[r] += allocation[p][r];
                    }
                    safeSequence.push('P' + (p + 1));
                    availableSnapshots.push([...available]);
                    processOrder.push({ 
                        pid: p,
                        available: [...available] 
                    });
                    finish[p] = true;
                    completedCount++;
                    found = true;
                    break; // Mulai dari proses pertama lagi
                }
            }
        }

        if (!found) {
            break; // Deadlock
        }
    }

    if (safeSequence.length === n) {
        alert("Sistem dalam keadaan aman.\nUrutan aman: " + safeSequence.join(" -> "));
    } else {
        alert("Sistem tidak dalam keadaan aman.");
    }

    // Bangun tabel hasil
    $('#result-table').empty();
    let resultTable = `
        <table class="table table-bordered text-center mt-3">
            <thead>
                <tr>
                    <th rowspan="2" style="vertical-align: middle;">Proses</th>
                    <th colspan="${m}">Alokasi</th>
                    <th colspan="${m}">Maksimal</th>
                    <th colspan="${m}">Tersedia</th>
                </tr>
                <tr>`;

    for (let i = 0; i < 3; i++) {
        for (let j = 1; j <= m; j++) {
            resultTable += `<th>R${j}</th>`;
        }
    }

    resultTable += `</tr></thead><tbody>`;

    for (let i = 0; i < n; i++) {
        resultTable += `<tr id="row-${i}"><td>P${i + 1}</td>`;

        allocation[i].forEach((val, r) => {
            resultTable += `<td class="alloc-cell alloc-p${i}-r${r}">${val}</td>`;
        });

        max[i].forEach((val, r) => {
            resultTable += `<td class="max-cell max-p${i}-r${r}">${val}</td>`;
        });

        if (availableSnapshots[i]) {
            availableSnapshots[i].forEach((val, r) => {
                resultTable += `<td class="avail-cell avail-step${i}-r${r}">${val}</td>`;
            });
        } else {
            for (let j = 0; j < m; j++) {
                resultTable += `<td>-</td>`;
            }
        }

        resultTable += `</tr>`;
    }

    // Baris akhir untuk available terakhir
    resultTable += `<tr><td colspan="${1 + 2 * m}"><strong>Akhir</strong></td>`;
    availableSnapshots[availableSnapshots.length - 1].forEach((val, r) => {
        resultTable += `<td class="avail-cell avail-end avail-final-r${r}"><strong>${val}</strong></td>`;
    });
    resultTable += `</tr>`;


    const wrappedTable = `<div class="my-5 row border rounded shadow-sm px-3">${resultTable}</div>`;
    $('#result-table').html(wrappedTable);

    // Tambahkan tombol simulasikan
    if (!$('#simulate-btn').length) {
        const btn = $('<button id="simulate-btn" class="btn btn-success mt-3">Simulasikan</button>');
        $('#btn').append(btn);
    }

    $('#simulate-btn').off('click').on('click', function () {
        let delay = 0;
        const delayStep = 1000;
    
        const highlightCells = (type, pid) => {
            for (let r = 0; r < m; r++) {
                setTimeout(() => {
                    const el = $(`.${type}-p${pid}-r${r}`);
                    el.removeClass('highlight');
                    void el[0]?.offsetWidth;
                    el.addClass('highlight');
                }, delay);
                delay += delayStep;
            }
        };
    
        const highlightStepAvail = (stepIndex) => {
            for (let r = 0; r < m; r++) {
                setTimeout(() => {
                    const el = $(`.avail-step${stepIndex}-r${r}`);
                    el.removeClass('highlight');
                    void el[0]?.offsetWidth;
                    el.addClass('highlight');
                }, delay);
                delay += delayStep;
            }
        };
    
        // Animasikan berdasarkan urutan proses yang disetujui
        for (let i = 0; i < processOrder.length; i++) {
            const pid = processOrder[i].pid;

            // 1. Highlight available sebelum alokasi
            highlightStepAvail(i);

            // 2. Highlight need (bisa diganti jadi max jika tidak ada need)
            highlightCells('max', pid);

            // 3. Highlight allocation (alokasi akan ditambahkan ke available)
            highlightCells('alloc', pid);
        }

        // 4. Highlight baris "Akhir"
        setTimeout(() => {
            for (let r = 0; r < m; r++) {
                setTimeout(() => {
                    const el = $(`.avail-final-r${r}`);
                    el.removeClass('highlight');
                    void el[0]?.offsetWidth;
                    el.addClass('highlight');
                }, r * delayStep);
            }
        }, delay);

        // 5. Bersihkan semua highlight
        setTimeout(() => {
            $('.highlight').removeClass('highlight');
        }, delay + m * delayStep + 500);
    });
}

//Proses loading
function load () {
    myvar = setTimeout(showPage, 100);
}
function showPage() {
    document.getElementById("loader").style.display = "none";
    document.getElementById("main").style.display = "block";
}