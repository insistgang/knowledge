import time
import joblib
import pandas as pd
from sklearn import clone
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder

from my_general import *


def fit_and_score(estimator, X_train, X_test, y_train, y_test):
    """Fit RandomForest and evaluate"""
    estimator.fit(X_train, y_train)
    y_pred = estimator.predict(X_test)
    y_prob = estimator.predict_proba(X_test)
    # 防止浮点误差
    row_sums = y_prob.sum(axis=1, keepdims=True)
    y_prob = y_prob / row_sums
    # 指标
    train_score = estimator.score(X_train, y_train)
    test_score = estimator.score(X_test, y_test)
    f1 = f1_score(y_test, y_pred, average="weighted")
    recall = recall_score(y_test, y_pred, average="weighted")
    # AUC：二分类和多分类区分
    if y_prob.shape[1] == 2:
        auc = roc_auc_score(y_test, y_prob[:, 1])
    else:
        auc = roc_auc_score(y_test, y_prob, multi_class="ovr")
    return estimator, {
        "train_acc": train_score,
        "test_acc": test_score,
        "f1": f1,
        "recall": recall,
        "auc": auc
    }


# 随机种子，确保结果可复现
random_state = 94
start = time.time()
# 加载数据
X, y = load_train_err_data(return_X_y=True)
# 将数据分为训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(X, y,
                                                    test_size=0.1, random_state=random_state)
le = LabelEncoder()
y = le.fit_transform(y)
is_ploted = True
# 2. 构建随机森林模型
rf = RandomForestClassifier(class_weight="balanced", n_estimators=300, random_state=random_state,oob_score=True)
# 交叉验证的定义
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
results = {}
curr_fold = 1
# 交叉验证
for train, test in cv.split(X, y):
    X_train = X[train]
    X_test = X[test]
    y_train = y[train]
    y_test = y[test]
    est, metrics = fit_and_score(clone(rf), X_train, X_test, y_train, y_test)
    results[curr_fold] = metrics
    curr_fold += 1
# 最终模型
rf, _ = fit_and_score(clone(rf), X_train, X_test, y_train, y_test)
# 保存模型
joblib.dump(rf, "randomforest_final.pkl")

mapping_df = pd.DataFrame({
    "数字标签": list(range(len(le.classes_))),
    "文本标签": le.classes_
})
mapping_df.to_csv("rf_label_mapping.csv", index=False, encoding="utf-8-sig")
print("标签映射表已保存到 rf_label_mapping.csv")

# 3. 训练模型
rf.fit(X_train, y_train)
# 4. 评估模型
y_pred = rf.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
print(f" 模型准确率 : {accuracy:.2f}")
# 展示运行结果
DeepLearningOnly.evaluate_diagnosis_model(rf, X_test, y_test, None, "Random Forest")
end = time.time()
print(f"运行时间: {end - start:.4f} 秒")
plt.show()
