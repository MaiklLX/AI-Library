# КТ-220 — актуальный статус веток AI-Library для романа

**Дата:** 2026-11-06  
**Основная ветка:** `editorial/restore-literary-standard-i16-onward`  
**Активный резерв:** `backup/poka-nas-ne-naydut-mirror-2026-11-06`

## Текущее сравнение GitHub

В таблице указано сравнение base → head. «Head впереди» означает коммиты только в основной редакционной ветке; «base впереди» — коммиты только в сравниваемой ветке.

| Base | Head | Статус | Editorial впереди | Base впереди |
|---|---|---|---:|---:|
| `main` | `editorial/restore-literary-standard-i16-onward` | diverged | 1 148 | 33 |
| `backup/poka-nas-ne-naydut-checkpoints-2026-11-06` | `editorial/restore-literary-standard-i16-onward` | diverged | 94 | 51 |
| `backup/poka-nas-ne-naydut-mirror-2026-11-06` | `editorial/restore-literary-standard-i16-onward` | identical | 0 | 0 |
| `editorial/volume-02-web-release-candidate` | `editorial/restore-literary-standard-i16-onward` | diverged | 1 267 | 40 |
| `editorial/novel-4.7-continuity` | `editorial/restore-literary-standard-i16-onward` | diverged | 1 523 | 16 |

## Что это означает

- Новая резервная ветка — точная копия редакционной: общий HEAD, ноль ahead/behind. После каждой КТ она должна обновляться до вершины редакционной ветки.
- Старая резервная ветка оставлена как архив. Её история разошлась с редакционной, поэтому она не используется для новых записей и не сливается автоматически.
- `main`, `volume-02-web-release-candidate` и `novel-4.7-continuity` содержат отдельные истории. Большое число коммитов впереди не означает, что эти ветки содержат более свежую редакцию романа: число отражает историю репозитория, а не полноту рукописи.
- Нельзя сливать эти ветки в редакционную только на основании ahead/behind. Для переноса конкретного материала требуется адресная проверка файлов и решений.

## Рабочее правило

Одна мастер-редакция — в `editorial/restore-literary-standard-i16-onward`. Один чистый резерв — в `backup/poka-nas-ne-naydut-mirror-2026-11-06`. Старые ветки не удаляются, но считаются историческими источниками, а не альтернативными текущими версиями.

**КТ-220 закрыта после повторного сравнения пяти пар веток. Ни одна ветка main или старые editorial-кандидаты не изменялись.**
