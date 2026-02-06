import time

import pandas as pd
from sklearn.base import clone
from sklearn.datasets import load_breast_cancer, load_iris, load_digits
from sklearn.model_selection import StratifiedKFold, train_test_split
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder

from my_general import *


def fit_and_score(estimator, X_train, X_test, y_train, y_test, fold,
                  plot=True):
    """Fit the estimator on the train set and score it on both sets"""
    estimator.fit(X_train, y_train, eval_set=[(X_train, y_train), (X_test, y_test)],
                  verbose=False)
    evals_result = estimator.evals_result()
    train_score = estimator.score(X_train, y_train)
    test_score = estimator.score(X_test, y_test)

    # 损失趋势可视化
    if plot:
        title = "Final Model" if fold == 6 else f"Fold {fold}"
        plt.subplot(2, 3, fold)
        loss_fun_name = "logloss" if len(set(y_test)) == 2 else "mlogloss"
        plt.plot(evals_result["validation_0"][loss_fun_name], label="Train")
        plt.plot(evals_result["validation_1"][loss_fun_name], label="Valid")
        plt.xlabel("Iteration")
        plt.ylabel(loss_fun_name.title())
        plt.title(title)
        plt.tight_layout()
        plt.legend()
        # plt.axhline(y=0.05, color="red", linestyle="--", label="y=0.05")
        # plt.show()

    return estimator, train_score, test_score, evals_result


if __name__ == '__main__':
    start = time.time()
    # 载入数据集
    X, y = load_train_err_data(return_X_y=True)
    # 假設 y 原本是字串標籤
    X = np.real(X).astype(np.float32)
    le = LabelEncoder()
    y = le.fit_transform(y)
    # 随机种子，确保结果可复现
    random_state = 94
    is_ploted = True

    # 分割数据集
    X_train, X_valid, y_train, y_valid = train_test_split(
        X, y, test_size=0.1, random_state=random_state, stratify=y
    )
    # 交叉验证的定义
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    # 模型定义（初始化时关闭早停）
    num_class = len(set(y))
    if num_class == 2:
        clf = xgb.XGBClassifier(tree_method="hist", eval_metric="logloss",
                                early_stopping_rounds=None, random_state=random_state)
    else:
        clf = xgb.XGBClassifier(tree_method="hist", num_class=num_class,
                                eval_metric="mlogloss",
                                objective="multi:softprob",  # 输出(n_samples, K)
                                early_stopping_rounds=None, random_state=random_state)
    results = {}
    curr_fold = 1
    # 初始化画布
    if is_ploted:
        plt.figure(figsize=(15, 8))
        plt.suptitle(f"XgBoost Logloss Trend", fontsize=16)
        plt.tight_layout()
    # 打开早停
    clf.set_params(early_stopping_rounds=10)

    # 交叉验证
    for train, test in cv.split(X, y):
        X_train = X[train]
        X_test = X[test]
        y_train = y[train]
        y_test = y[test]
        est, train_score, test_score, evals_result = fit_and_score(
            clone(clf), X_train, X_test, y_train, y_test, curr_fold,
            plot=is_ploted
        )
        results[est] = (train_score, test_score, evals_result)
        curr_fold += 1
    # 最终模型
    final_clf, _, _, _ = fit_and_score(
        clone(clf), X_train, X_valid, y_train, y_valid, curr_fold,
        plot=is_ploted
    )
    final_clf.save_model("xgboost_final.json")
    DeepLearningOnly.evaluate_diagnosis_model(final_clf, X_valid, y_valid, None, "XgBoost")
    # 生成 DataFrame
    mapping_df = pd.DataFrame({
        "数字标签": list(range(len(le.classes_))),
        "文本标签": le.classes_
    })

    # 保存到 CSV 文件
    mapping_df.to_csv("label_mapping.csv", index=False, encoding="utf-8-sig")
    print("\n标签映射表已保存到 label_mapping.csv")

    # 展示
    plt.tight_layout(rect=[0, 0, 1, 1])
    end = time.time()
    print(f"运行时间: {end - start:.4f} 秒")
    plt.show()
