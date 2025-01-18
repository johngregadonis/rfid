package com.example.vechicle;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.recyclerview.widget.RecyclerView;

import java.util.List;

public class DeductMessageAdapter extends RecyclerView.Adapter<DeductMessageAdapter.DeductMessageViewHolder> {

    private Context context;
    private List<DeductMessage> deductMessageList;

    public DeductMessageAdapter(Context context, List<DeductMessage> deductMessageList) {
        this.context = context;
        this.deductMessageList = deductMessageList;
    }

    @Override
    public DeductMessageViewHolder onCreateViewHolder(ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(context).inflate(R.layout.item_message, parent, false);
        return new DeductMessageViewHolder(view);
    }

    @Override
    public void onBindViewHolder(DeductMessageViewHolder holder, int position) {
        DeductMessage deductMessage = deductMessageList.get(position);
        holder.deductMessageText.setText(deductMessage.getDeductMessage());
        holder.createdAtText.setText(deductMessage.getCreatedAt());
    }

    @Override
    public int getItemCount() {
        return deductMessageList.size();
    }

    public class DeductMessageViewHolder extends RecyclerView.ViewHolder {

        TextView deductMessageText, createdAtText;

        public DeductMessageViewHolder(View itemView) {
            super(itemView);
            deductMessageText = itemView.findViewById(R.id.deductMessageText);
            createdAtText = itemView.findViewById(R.id.createdAt);
        }
    }
}
//old