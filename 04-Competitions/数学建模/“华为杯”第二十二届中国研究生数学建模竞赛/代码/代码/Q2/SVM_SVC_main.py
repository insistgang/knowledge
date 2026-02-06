import time

from sklearn.model_selection import StratifiedKFold
from sklearn.datasets import load_iris, load_digits
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.svm import SVC
from my_general import *

# 随机种子，确保结果可复现
random_state = 94

if __name__ == '__main__':
    start = time.time()
    # 加载数据
    X, y = load_train_err_data(return_X_y=True)
    le = LabelEncoder()
    y = le.fit_transform(y)
    X_train, X_test, y_train, y_test = \
        train_test_split(X, y, test_size=0.1, random_state=42, stratify=y)

    # 标准化定义
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)
    # 交叉验证的定义
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    # 定义模型
    clf = SVC(kernel="rbf", probability=True)

    # 交叉验证并保存过程数据
    mlogloss_scores = []
    for fold, (train_idx, val_idx) in enumerate(cv.split(X, y), 1):
        clf.fit(X[train_idx], y[train_idx])
        y_prob_tmp = clf.predict_proba(X[val_idx])
        loss = log_loss(y[val_idx], y_prob_tmp)
        mlogloss_scores.append(loss)
        print(f"Fold {fold}: LogLoss = {loss:.4f}")
    # 最终训练
    clf.fit(X_train, y_train)

    # 预测
    y_pred = clf.predict(X_test)
    y_prob = clf.predict_proba(X_test)
    # 评估模型
    StatisticsOnly.evaluate_diagnosis_model(clf, y_test, y_pred, y_prob, mlogloss_scores, "SVM")
    # 展示运行结果
    end = time.time()
    print(f"运行时间: {end - start:.4f} 秒")
    plt.show()
