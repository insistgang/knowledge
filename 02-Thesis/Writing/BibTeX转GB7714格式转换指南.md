# BibTeX到GB/T 7714-2015格式转换指南

> 创建日期：2026-02-07
> 用途：将BibTeX格式转换为中文国标引用格式

---

## 一、转换规则

### 1.1 作者姓名转换

| BibTeX格式 | GB/T 7714格式 |
|------------|---------------|
| author={He, Kaiming} | HE K |
| author={He, Kaiming and Zhang, Xiangyu} | HE K, ZHANG X |
| author={He, Kaiming and Zhang, Xiangyu and Ren, Shaoqing and Sun, Jian} | HE K, ZHANG X, REN S, et al. |

**规则：**
- 姓全大写（或首字母大写）
- 名缩写为首字母
- 三人以内全列，三人以上列前三位+等/et al.
- 作者间用逗号分隔

### 1.2 文献类型标识转换

| BibTeX | GB/T 7714 |
|--------|-----------|
| @inproceedings | [C] |
| @article | [J] |
| @mastersthesis | [D] |
| @phdthesis | [D] |
| @book | [M] |
| @misc/[EB/OL] | [EB/OL] |

### 1.3 标题转换

| BibTeX | GB/T 7714 |
|--------|-----------|
| title={Deep Residual Learning for Image Recognition} | Deep Residual Learning for Image Recognition |
| title={YOLOv3: An Incremental Improvement} | YOLOv3: An Incremental Improvement |

**规则：**
- 保留原标题大小写（英文）
- 中文标题保持原样

### 1.4 期刊/会议名称转换

**完整名称转换：**
```
Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition
→
```

### 1.5 年份页码转换

| BibTeX | GB/T 7714 |
|--------|-----------|
| year={2016}, pages={770--778} | 2016: 770-778 |
| volume={39}, number={3}, pages={40--46} | 2023, 38(3): 40-46 |

---

## 二、完整转换示例

### 示例1：会议论文 [C]

**BibTeX格式：**
```bibtex
@inproceedings{redmon2016yolo,
  title={You Only Look Once: Unified, Real-Time Object Detection},
  author={Redmon, Joseph and Divvala, Santosh and Girshick, Ross and Farhadi, Ali},
  booktitle={Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition},
  pages={779--788},
  year={2016}
}
```

**GB/T 7714格式：**
```
REDMON J, DIVVALA S, GIRSHICK R, et al. You Only Look Once: Unified, Real-Time Object Detection[C]//Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition. 2016: 779-788.
```

---

### 示例2：期刊论文 [J]

**BibTeX格式：**
```bibtex
@article{he2016resnet,
  title={Deep Residual Learning for Image Recognition},
  author={He, Kaiming and Zhang, Xiangyu and Ren, Shaoqing and Sun, Jian},
  journal={IEEE Transactions on Pattern Analysis and Machine Intelligence},
  volume={39},
  number={1},
  pages={173--186},
  year={2017}
}
```

**GB/T 7714格式：**
```
HE K M, ZHANG X Y, REN S Q, et al. Deep Residual Learning for Image Recognition[J]. IEEE Transactions on Pattern Analysis and Machine Intelligence, 2017, 39(1): 173-186.
```

---

### 示例3：中文期刊论文 [J]

**BibTeX格式：**
```bibtex
@article{kong2023manhole,
  title={改进YOLOv5的路面井盖病害检测},
  author={孔天宇 and 戴激光},
  journal={遥感信息},
  volume={38},
  number={3},
  pages={40--46},
  year={2023}
}
```

**GB/T 7714格式：**
```
孔天宇, 戴激光. 改进YOLOv5的路面井盖病害检测[J]. 遥感信息, 2023, 38(3): 40-46.
```

---

### 示例4：学位论文 [D]

**BibTeX格式：**
```bibtex
@mastersthesis{papageorgiou2022deep,
  title={Deep Learning and Object Detection},
  author={Papageorgiou, Theodoros},
  school={University of Piraeus},
  year={2022}
}
```

**GB/T 7714格式：**
```
PAPAGEORGIOU T. Deep Learning and Object Detection[D]. University of Piraeus, 2022.
```

---

### 示例5：电子资源 [EB/OL]

**BibTeX格式：**
```bibtex
@misc{ultralytics2024yolov11,
  title={Ultralytics YOLOv11},
  author={Ultralytics},
  year={2024},
  url={https://github.com/ultralytics/ultralytics}
}
```

**GB/T 7714格式：**
```
ULTRALYTICS. Ultralytics YOLOv11[EB/OL]. (2024-09-10)[2026-02-07]. https://github.com/ultralytics/ultralytics.
```

---

## 三、常见转换错误

| 错误类型 | 错误示例 | 正确格式 |
|----------|----------|----------|
| 作者姓名小写 | He K, Zhang X | HE K, ZHANG X |
| 作者超3人未缩写 | 作者1, 作者2, 作者3, 作者4, 作者5 | 作者1, 作者2, 作者3, et al. |
| 文献类型错误 | 论文标题[M] | 论文标题[J] |
| 页码用-- | 770--778 | 770-778 |
| 缺少文献类型 | REDMON J. You Only Look Once | REDMON J. You Only Look Only[C]//... |
| 会议名缩写 | CVPR | IEEE Conference on... |

---

## 四、批量转换脚本

### Python脚本示例

```python
import re

def convert_bibtex_to_gb(bibtex_str):
    """
    将BibTeX格式转换为GB/T 7714-2015格式
    """
    # 提取作者
    author_match = re.search(r'author\s*=\s*\{(.*?)\}', bibtex_str)
    if author_match:
        authors = author_match.group(1)
        # 转换作者格式
        authors = authors.replace(' and ', ', ')
        # 姓全大写，名缩写
        author_list = []
        for a in authors.split(','):
            parts = a.strip().split()
            if parts:
                last = parts[0].upper()
                first = ' '.join(parts[1:]) if len(parts) > 1 else ''
                first_init = ''.join([f[0].upper() for f in first.split()])
                author_list.append(f"{last} {first_init}" if first_init else last)

        if len(author_list) > 3:
            authors_gb = ', '.join(author_list[:3]) + ', et al.'
        else:
            authors_gb = ', '.join(author_list)

    # 提取标题
    title_match = re.search(r'title\s*=\s*\{(.*?)\}', bibtex_str)
    title = title_match.group(1) if title_match else ''

    # 确定文献类型
    if '@inproceedings' in bibtex_str:
        doc_type = '[C]'
    elif '@article' in bibtex_str:
        doc_type = '[J]'
    elif '@mastersthesis' in bibtex_str or '@phdthesis' in bibtex_str:
        doc_type = '[D]'
    elif '@book' in bibtex_str:
        doc_type = '[M]'
    else:
        doc_type = '[EB/OL]'

    # 生成GB/T格式
    result = f"{authors_gb}. {title}{doc_type}"

    # 添加期刊/会议信息
    if doc_type == '[J]':
        journal_match = re.search(r'journal\s*=\s*\{(.*?)\}', bibtex_str)
        if journal_match:
            result += f". {journal_match.group(1)}"

    # 添加年份和页码
    year_match = re.search(r'year\s*=\s*\{(\d+)\}', bibtex_str)
    pages_match = re.search(r'pages\s*=\s*\{(\d+)\s*--\s*(\d+)\}', bibtex_str)

    if year_match:
        year = year_match.group(1)
        if pages_match:
            result += f", {year}: {pages_match.group(1)}-{pages_match.group(2)}."
        else:
            result += f", {year}."

    return result
```

---

## 五、在线转换工具

| 工具 | 网址 | 说明 |
|------|------|------|
| Zotero | zotero.org | 导出时可选择GB/T 7714格式 |
| NoteExpress | noteexpress.com | 国内软件，内置国标格式 |
| CNKI E-Study | cnki.net | 知网官方，支持国标导出 |
| BibTeX.cn | bibtex.cn | 在线转换工具 |

---

**创建人**：Citation Manager
**最后更新**：2026-02-07

**相关文档：**
- `02-Thesis/Writing/参考文献模板_2026-02-07.bib`
- `02-Thesis/Writing/最终引用列表模板.md`
