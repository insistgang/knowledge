import time

from sklearn.datasets import load_iris, load_digits
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from my_general import *

# 随机种子，确保结果可复现
random_state = 94

if __name__ == '__main__':
    start = time.time()
    # 载入数据集
    X, y = load_train_err_data(return_X_y=True)
    le = LabelEncoder()
    y = le.fit_transform(y)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.1, random_state=random_state, stratify=y
    )

    # 标准化
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)
    # 交叉验证的定义
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    # 定义模型并拟合
    neigh = KNeighborsClassifier(n_neighbors=5)

    # 交叉验证并保存过程数据
    mlogloss_scores = []
    for fold, (train_idx, val_idx) in enumerate(cv.split(X, y), 1):
        neigh.fit(X[train_idx], y[train_idx])
        y_prob_tmp = neigh.predict_proba(X[val_idx])
        loss = log_loss(y[val_idx], y_prob_tmp)
        mlogloss_scores.append(loss)
        print(f"Fold {fold}: LogLoss = {loss:.4f}")
    # 最终训练
    neigh.fit(X_train, y_train)

    # 评估
    y_pred = neigh.predict(X_test)
    # 概率预测
    y_prob = neigh.predict_proba(X_test)
    StatisticsOnly.evaluate_diagnosis_model(neigh, y_test, y_pred, y_prob, mlogloss_scores, "kNN")
    # # 混淆矩阵
    # disp = ConfusionMatrixDisplay.from_predictions(y_test, y_pred,
    #                                                display_labels=load_digits().target_names,
    #                                                cmap=plt.cm.Blues)
    # plt.title("kNN Confusion Matrix")
    # plt.xticks(rotation=90)
    end = time.time()
    print(f"运行时间: {end - start:.4f} 秒")
    plt.show()
