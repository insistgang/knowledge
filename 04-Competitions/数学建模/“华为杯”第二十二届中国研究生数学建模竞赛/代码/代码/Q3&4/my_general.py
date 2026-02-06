import scipy.io as sio
import numpy as np
from matplotlib import pyplot as plt
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay, classification_report, roc_auc_score, log_loss, \
    accuracy_score, recall_score, f1_score
from sklearn.model_selection import GridSearchCV


def load_train_err_data(return_X_y=True):
    # 读取 .mat 文件
    mat_data = sio.loadmat("task1_simple_21class_50selected_py.mat", squeeze_me=True, struct_as_record=False)

    # 取出结构体 results
    dataset = mat_data["simple_50selected"]

    # 提取数据
    X = np.real(np.array(dataset.X)).astype(np.float32)
    y = dataset.y
    return X, y


# 搜索最佳参数
def search_best_params(clf, X, y, param_grid):
    grid = GridSearchCV(
        estimator=clf,
        param_grid=param_grid,
        scoring="neg_log_loss",  # 用 logloss 优化
        cv=3,  # 内部交叉验证
        verbose=1,
        n_jobs=-1
    )
    # 在全数据（X, y）上找最佳参数
    grid.fit(X, y)

    print("Best params:", grid.best_params_)
    print("Best logloss:", -grid.best_score_)
    return grid.best_params_


class DeepLearningOnly:
    @staticmethod
    def evaluate_diagnosis_model(model, X_test, y_test, le=None, label=""):
        # 分类预测
        y_pred = model.predict(X_test)
        if le:
            y_test = le.inverse_transform(y_test)
            y_pred = le.inverse_transform(y_pred)
        # 概率预测（算 AUC 用）
        y_prob = model.predict_proba(X_test)

        acc = accuracy_score(y_test, y_pred)
        recall = recall_score(y_test, y_pred, average="weighted")  # "weighted":按样本数加权平均
        f1 = f1_score(y_test, y_pred, average="weighted")

        # 判断二分类/多分类
        if y_prob.shape[1] == 2:
            # 若为二分类，只取正类概率
            auc = roc_auc_score(y_test, y_prob[:, 1])
        else:
            # 若为多分类，用完整概率矩阵
            auc = roc_auc_score(y_test, y_prob, multi_class="ovr")
        final_logloss = log_loss(y_test, y_prob)
        # 混淆矩阵
        cm = confusion_matrix(y_test, y_pred)
        disp = ConfusionMatrixDisplay(confusion_matrix=cm)
        disp.plot(cmap=plt.cm.Blues)  # 配色方案
        plt.title(f"Confusion Matrix({label})")
        # final_clf 已经训练完
        if hasattr(model, "evals_result"):
            evals_result = model.evals_result()
            # 获取验证集最后一轮的 mlogloss
            loss_fun_name = "logloss" if len(set(y_test)) == 2 else "mlogloss"
            final_mlogloss = evals_result["validation_1"][loss_fun_name][-1]
            print(f"Final validation {loss_fun_name}: {final_mlogloss:.4f}")

        # print(f"Accuracy     : {acc:.4f}")
        # print(f"Recall       : {recall:.4f}")
        # print(f"F1-score     : {f1:.4f}")
        print(f"=== 分类报告 ===")
        print(classification_report(y_test, y_pred))
        print(f"ROC-AUC      : {auc:.4f}")
        if not  hasattr(model, "evals_result"):
            print(f"LogLoss      : {final_logloss:.4f}")
        # print("Confusion Matrix:\n", cm)

        return {"accuracy": acc, "recall": recall, "f1": f1,
                "auc": auc, "confusion_matrix": cm}


class StatisticsOnly:
    @staticmethod
    def evaluate_diagnosis_model(clf, y_test, y_pred, y_prob, mlogloss_scores, tag="Default", le=None):
        if le is not None:
            y_test = le.inverse_transform(y_test)
            y_pred = le.inverse_transform(y_pred)
            class_labels = le.classes_
        else:
            class_labels = clf.classes_
        # Log Loss
        mlogloss = log_loss(y_test, y_prob)
        # 判断二分类/多分类
        if y_prob.shape[1] == 2:
            # 若为二分类，只取正类概率
            auc = roc_auc_score(y_test, y_prob[:, 1])
        else:
            # 若为多分类，用完整概率矩阵
            auc = roc_auc_score(y_test, y_prob, multi_class="ovr")
        # 数值评估
        print(f"=== {tag} 分类报告 ===")
        print(classification_report(y_test, y_pred))
        print(f"ROC-AUC      : {auc:.4f}")
        # 可视化
        # 画趋势图
        plt.figure(figsize=(6, 4))
        plt.plot(range(1, len(mlogloss_scores) + 1), mlogloss_scores, marker="o")
        plt.xlabel("Fold")
        plt.ylabel("LogLoss")
        plt.title(f"{tag} Cross-Validation LogLoss Trend")
        plt.grid(True)
        # plt.show()
        print(f"平均 LogLoss: {np.mean(mlogloss_scores):.4f}")
        print(f"{tag} Final Multi-class Log Loss: {mlogloss:.4f}")
        x_final = len(mlogloss_scores) + 1
        y_final = mlogloss
        # 最终模型的mlogloss
        plt.plot(x_final, y_final, marker="o", label="Final")
        # 添加 annotate 标注
        plt.annotate(
            "Final",
            xy=(x_final, y_final),  # 点的位置
            xytext=(x_final - 0.4, y_final + 0.05),  # 文本位置（稍微右上角）
            arrowprops=dict(facecolor="black", arrowstyle="->"),
            fontsize=10
        )
        # 混淆矩阵可视化
        cm = confusion_matrix(y_test, y_pred, labels=class_labels)
        disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=class_labels)
        disp.plot(cmap="Blues")
        plt.title(f"Confusion Matrix({tag} Model)")
